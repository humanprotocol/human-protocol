"""Image task exporters.

Each exporter owns both the orchestration (download annotations, upload results, notify the
recording oracle) and its task-specific datumaro postprocessing. ``ImageJobExporter`` holds the
shared export flow + the generic CVAT->datumaro conversion pipeline; per-task subclasses override
only the parts that differ.
"""

from __future__ import annotations

import io
import os
import zipfile
from tempfile import TemporaryDirectory
from typing import TYPE_CHECKING

import datumaro as dm

import src.core.tasks.boxes_from_points as boxes_from_points_task
import src.core.tasks.skeletons_from_boxes as skeletons_from_boxes_task
import src.services.cvat as cvat_service
import src.utils.annotations as annotation_utils
from src.core.annotation_meta import RESULTING_ANNOTATIONS_FILE
from src.core.config import Config
from src.core.manifest import get_manifest_task_type
from src.core.storage import compose_data_bucket_filename
from src.core.tasks import TaskTypes
from src.core.tasks.cvat_formats import DM_DATASET_FORMAT_MAPPING
from src.handlers.job_export.downloading import (
    download_job_annotations,
    download_project_annotations,
)
from src.handlers.job_export.exporters.base import JobExporter
from src.handlers.job_export.results import FileDescriptor, prepare_annotation_metafile
from src.services.cloud import make_client as make_cloud_client
from src.services.cloud.utils import BucketAccessInfo
from src.utils.zip_archive import extract_zip_archive, write_dir_to_zip_archive

if TYPE_CHECKING:
    from collections.abc import Sequence

    from datumaro.components.dataset import Dataset

    from src.models.cvat import Image

CVAT_EXPORT_FORMAT_MAPPING = {
    TaskTypes.image_label_binary: "CVAT for images 1.1",
    TaskTypes.image_points: "CVAT for images 1.1",
    TaskTypes.image_boxes: "COCO 1.0",
    TaskTypes.image_polygons: "COCO 1.0",
    TaskTypes.image_boxes_from_points: "COCO 1.0",
    TaskTypes.image_skeletons_from_boxes: "CVAT for images 1.1",
}

CVAT_EXPORT_FORMAT_TO_DM_MAPPING = {
    "CVAT for images 1.1": "cvat",
    "COCO 1.0": "coco_instances",
}


class ImageJobExporter(JobExporter):
    """Base image exporter: download the single project + per-job annotations, run the datumaro
    conversion pipeline, upload the results, and notify the recording oracle."""

    def export(self) -> None:
        escrow_address = self.escrow_address
        chain_id = self.chain_id

        escrow_creation = cvat_service.get_escrow_creation_by_escrow_address(
            self.session, escrow_address, chain_id, active=False
        )
        if not escrow_creation:
            raise AssertionError(f"Can't find escrow creation for escrow '{escrow_address}'")

        jobs = cvat_service.get_jobs_by_escrow_address(self.session, escrow_address, chain_id)
        if len(jobs) != escrow_creation.total_jobs:
            raise AssertionError(
                f"Unexpected number of jobs fetched for escrow "
                f"'{escrow_address}': {len(jobs)}, expected {escrow_creation.total_jobs}"
            )

        self.logger.debug(f"Downloading results for the escrow ({escrow_address=})")

        annotation_format = self._annotation_format
        # FUTURE-TODO: probably can be removed in the future since
        # these annotations are no longer used in Recording Oracle
        job_annotations = download_job_annotations(self.logger, annotation_format, jobs)

        project_annotations_file, project_images = self._collect_project_annotations(
            annotation_format
        )

        resulting_annotations_file_desc = FileDescriptor(
            filename=RESULTING_ANNOTATIONS_FILE,
            file=project_annotations_file,
        )
        annotations = (resulting_annotations_file_desc, *job_annotations.values())

        self.logger.debug(f"Postprocessing results for the escrow ({escrow_address=})")

        self._merged_annotation_file = resulting_annotations_file_desc
        self._project_images = project_images
        self._prepare()
        self._postprocess(annotations)

        self.logger.debug(f"Uploading annotations for the escrow ({escrow_address=})")

        self._upload_results(files=(*annotations, prepare_annotation_metafile(jobs=jobs)))

        self._emit_escrow_recorded()

        self.logger.info(
            f"The escrow ({escrow_address=}) is completed, "
            f"resulting annotations are processed successfully"
        )

    # -- formats ----------------------------------------------------------- #

    @property
    def _task_type(self) -> TaskTypes:
        return get_manifest_task_type(self.manifest)

    @property
    def _annotation_format(self) -> str:
        return CVAT_EXPORT_FORMAT_MAPPING[self._task_type]

    @property
    def _input_format(self) -> str:
        return CVAT_EXPORT_FORMAT_TO_DM_MAPPING[self._annotation_format]

    @property
    def _output_format(self) -> str:
        return DM_DATASET_FORMAT_MAPPING[self._task_type]

    # -- project annotations ----------------------------------------------- #

    def _collect_project_annotations(
        self, annotation_format: str
    ) -> tuple[io.RawIOBase | None, list[Image] | None]:
        # escrows with simple task types must have only one project
        try:
            (project,) = self.escrow_projects
        except ValueError:
            raise NotImplementedError(
                f"{self._task_type} is expected to have exactly one project,"
                f" not {len(self.escrow_projects)}"
            )

        project_annotations_file = download_project_annotations(
            self.logger, annotation_format, project.cvat_id
        )
        project_images = cvat_service.get_project_images(self.session, project.cvat_id)
        return project_annotations_file, project_images

    # -- datumaro conversion pipeline -------------------------------------- #

    def _prepare(self) -> None:
        """Download any task-specific meta needed for postprocessing (default: nothing)."""

    def _postprocess(self, annotations: Sequence[FileDescriptor]) -> None:
        self._run_pipeline(annotations)

    def _run_pipeline(self, annotations: Sequence[FileDescriptor]) -> None:
        with TemporaryDirectory() as tempdir:
            for ann_descriptor in annotations:
                if not zipfile.is_zipfile(ann_descriptor.file):
                    raise ValueError("Annotation files must be zip files")
                ann_descriptor.file.seek(0)

                extract_dir = os.path.join(
                    tempdir,
                    os.path.splitext(os.path.basename(ann_descriptor.filename))[0],
                )
                extract_zip_archive(ann_descriptor.file, extract_dir)

                export_dir = os.path.join(
                    tempdir,
                    os.path.splitext(os.path.basename(ann_descriptor.filename))[0] + "_conv",
                )

                self._process_annotation_file(ann_descriptor, extract_dir, export_dir)

                converted_dataset_archive = io.BytesIO()
                write_dir_to_zip_archive(export_dir, converted_dataset_archive)
                converted_dataset_archive.seek(0)

                ann_descriptor.file = converted_dataset_archive

    def _is_merged_dataset(self, ann_descriptor: FileDescriptor) -> bool:
        return ann_descriptor == self._merged_annotation_file

    def _process_annotation_file(
        self, ann_descriptor: FileDescriptor, input_dir: str, output_dir: str
    ):
        input_dataset = self._parse_dataset(ann_descriptor, input_dir)
        output_dataset = self._process_dataset(input_dataset, ann_descriptor=ann_descriptor)
        self._export_dataset(output_dataset, output_dir)

    def _parse_dataset(self, ann_descriptor: FileDescriptor, dataset_dir: str) -> dm.Dataset:  # noqa: ARG002
        return dm.Dataset.import_from(dataset_dir, self._input_format)

    def _export_dataset(self, dataset: dm.Dataset, output_dir: str):
        dataset.export(output_dir, self._output_format, save_media=False)

    def _process_dataset(
        self, dataset: dm.Dataset, *, ann_descriptor: FileDescriptor
    ) -> dm.Dataset:
        dataset = dataset.transform(
            "map_subsets", mapping=[(sn, dm.DEFAULT_SUBSET_NAME) for sn in dataset.subsets()]
        )

        # TODO: remove complete duplicates in annotations

        if self._is_merged_dataset(ann_descriptor):
            dataset = self._process_merged_dataset(dataset)

        return dataset

    def _process_merged_dataset(self, input_dataset: dm.Dataset) -> dm.Dataset:
        return annotation_utils.remove_duplicated_gt_frames(
            input_dataset,
            known_frames=[image.filename for image in self._project_images],
        )


class LabelsJobExporter(ImageJobExporter):
    pass


class BoxesJobExporter(ImageJobExporter):
    pass


class PolygonsJobExporter(ImageJobExporter):
    pass


class PointsJobExporter(ImageJobExporter):
    def _parse_dataset(self, ann_descriptor: FileDescriptor, dataset_dir: str) -> Dataset:
        annotation_utils.prepare_cvat_annotations_for_dm(dataset_dir)
        return super()._parse_dataset(ann_descriptor, dataset_dir)

    def _process_dataset(self, dataset: Dataset, *, ann_descriptor: FileDescriptor) -> Dataset:
        # We need to convert point arrays, which cannot be represented in COCO directly,
        # into the 1-point skeletons, compatible with COCO person keypoints, which is the
        # required output format
        dataset = annotation_utils.convert_point_arrays_dataset_to_1_point_skeletons(
            dataset,
            labels=[label.name for label in self.manifest.annotation.labels],
        )

        return super()._process_dataset(dataset, ann_descriptor=ann_descriptor)


class BoxesFromPointsJobExporter(ImageJobExporter):
    def _prepare(self) -> None:
        roi_filenames, roi_infos, points_dataset = self._download_task_meta()

        self.points_dataset = points_dataset
        self.original_key_to_sample = {sample.attributes["id"]: sample for sample in points_dataset}

        roi_info_by_id = {roi_info.point_id: roi_info for roi_info in roi_infos}

        self.roi_name_to_roi_info: dict[str, boxes_from_points_task.RoiInfo] = {
            os.path.splitext(roi_filename)[0]: roi_info_by_id[roi_id]
            for roi_id, roi_filename in roi_filenames.items()
        }

    def _download_task_meta(self):
        layout = boxes_from_points_task.TaskMetaLayout()
        serializer = boxes_from_points_task.TaskMetaSerializer()

        oracle_data_bucket = BucketAccessInfo.parse_obj(Config.storage_config)
        storage_client = make_cloud_client(oracle_data_bucket)

        roi_filenames = serializer.parse_roi_filenames(
            storage_client.download_file(
                compose_data_bucket_filename(
                    self.escrow_address, self.chain_id, layout.ROI_FILENAMES_FILENAME
                ),
            )
        )

        rois = serializer.parse_roi_info(
            storage_client.download_file(
                compose_data_bucket_filename(
                    self.escrow_address, self.chain_id, layout.ROI_INFO_FILENAME
                ),
            )
        )

        points_dataset = serializer.parse_points_annotations(
            storage_client.download_file(
                compose_data_bucket_filename(
                    self.escrow_address, self.chain_id, layout.POINTS_FILENAME
                ),
            )
        )

        return roi_filenames, rois, points_dataset

    def _process_merged_dataset(self, input_dataset: Dataset) -> Dataset:
        point_roi_dataset = super()._process_merged_dataset(input_dataset)

        merged_sample_dataset = dm.Dataset(
            media_type=dm.Image,
            categories={
                dm.AnnotationType.label: dm.LabelCategories.from_iterable(
                    [label.name for label in self.manifest.annotation.labels]
                )
            },
        )

        for roi_sample in point_roi_dataset:
            roi_info = self.roi_name_to_roi_info[os.path.basename(roi_sample.id)]
            original_sample = self.original_key_to_sample[roi_info.original_image_key]

            merged_sample = merged_sample_dataset.get(original_sample.id)
            if not merged_sample:
                merged_sample = original_sample.wrap(annotations=[])
                merged_sample_dataset.put(merged_sample)

            image_h, image_w = merged_sample.image.size

            old_point = next(
                skeleton
                for skeleton in original_sample.annotations
                if skeleton.id == roi_info.point_id
                if isinstance(skeleton, dm.Skeleton)
            ).elements[0]
            old_x, old_y = old_point.points[:2]

            roi_anns = [
                roi_ann.wrap(
                    id=roi_info.point_id,
                    attributes={
                        **roi_sample.attributes,
                        boxes_from_points_task.OUTPUT_OBJECT_ID_ATTR: roi_info.point_id,
                    },
                )
                for roi_ann in roi_sample.annotations
                if isinstance(roi_ann, dm.Bbox)
            ]

            merged_sample.annotations.extend(
                annotation_utils.shift_ann(
                    roi_ann,
                    offset_x=old_x - roi_info.point_x,
                    offset_y=old_y - roi_info.point_y,
                    img_w=image_w,
                    img_h=image_h,
                )
                for roi_ann in roi_anns
            )

        return merged_sample_dataset


class SkeletonsJobExporter(ImageJobExporter):
    # Reconstruct skeletons from per-point annotation jobs

    def _collect_project_annotations(
        self, annotation_format: str
    ) -> tuple[io.RawIOBase | None, list[Image] | None]:
        assert self.escrow_projects  # unused, but must hold the lock
        del annotation_format  # the jobs are self-merged, no project export
        return None, None

    def _prepare(self) -> None:
        roi_filenames, roi_infos, boxes_dataset, job_label_mapping = self._download_task_meta()

        self.boxes_dataset = boxes_dataset
        self.original_key_to_sample = {sample.attributes["id"]: sample for sample in boxes_dataset}

        roi_info_by_id = {roi_info.bbox_id: roi_info for roi_info in roi_infos}

        self.roi_name_to_roi_info: dict[str, skeletons_from_boxes_task.RoiInfo] = {
            os.path.splitext(roi_filename)[0]: roi_info_by_id[roi_id]
            for roi_id, roi_filename in roi_filenames.items()
        }

        self.job_label_mapping = job_label_mapping

    def _download_task_meta(self):
        layout = skeletons_from_boxes_task.TaskMetaLayout()
        serializer = skeletons_from_boxes_task.TaskMetaSerializer()

        oracle_data_bucket = BucketAccessInfo.parse_obj(Config.storage_config)
        storage_client = make_cloud_client(oracle_data_bucket)

        roi_filenames = serializer.parse_roi_filenames(
            storage_client.download_file(
                compose_data_bucket_filename(
                    self.escrow_address, self.chain_id, layout.ROI_FILENAMES_FILENAME
                ),
            )
        )

        rois = serializer.parse_roi_info(
            storage_client.download_file(
                compose_data_bucket_filename(
                    self.escrow_address, self.chain_id, layout.ROI_INFO_FILENAME
                ),
            )
        )

        boxes_dataset = serializer.parse_bbox_annotations(
            storage_client.download_file(
                compose_data_bucket_filename(
                    self.escrow_address, self.chain_id, layout.BOXES_FILENAME
                ),
            )
        )

        job_label_mapping = serializer.parse_point_labels(
            storage_client.download_file(
                compose_data_bucket_filename(
                    self.escrow_address, self.chain_id, layout.POINT_LABELS_FILENAME
                ),
            )
        )

        return roi_filenames, rois, boxes_dataset, job_label_mapping

    def _init_merged_dataset(self):
        label_cat = dm.LabelCategories()
        points_cat = dm.PointsCategories()

        # Maintain label order for simplicity
        for manifest_skeleton in self.manifest.annotation.labels:
            label_cat.add(manifest_skeleton.name)

        for manifest_skeleton in self.manifest.annotation.labels:
            points_cat.add(
                label_cat.find(manifest_skeleton.name)[0],
                labels=manifest_skeleton.nodes,
                joints=manifest_skeleton.joints,
            )

            for manifest_skeleton_point in manifest_skeleton.nodes:
                label_cat.add(manifest_skeleton_point, parent=manifest_skeleton.name)

        self.job_point_label_id_to_merged_label_id = {
            (label_cat.find(skeleton_label)[0], job_point_label): label_cat.find(
                point_label, parent=skeleton_label
            )[0]
            for (skeleton_label, point_label), job_point_label in self.job_label_mapping.items()
        }

        self.merged_dataset = dm.Dataset(
            categories={
                dm.AnnotationType.label: label_cat,
                dm.AnnotationType.points: points_cat,
            },
            media_type=dm.Image,
        )

        bbox_label_to_merged = {
            bbox_label_id: label_cat.find(bbox_label.name)[0]
            for bbox_label_id, bbox_label in enumerate(
                self.boxes_dataset.categories()[dm.AnnotationType.label]
            )
        }
        self.bbox_label_to_merged = bbox_label_to_merged

        for bbox_sample in self.boxes_dataset:
            self.merged_dataset.put(bbox_sample.wrap(annotations=[]))

    def _parse_dataset(self, ann_descriptor: FileDescriptor, dataset_dir: str) -> Dataset:
        annotation_utils.prepare_cvat_annotations_for_dm(dataset_dir)
        return super()._parse_dataset(ann_descriptor, dataset_dir)

    def _process_dataset(self, dataset: Dataset, *, ann_descriptor: FileDescriptor) -> Dataset:
        dataset = super()._process_dataset(dataset, ann_descriptor=ann_descriptor)

        job_label_cat = dataset.categories()[dm.AnnotationType.label]
        merged_skeleton_id = None
        merged_skeleton_name = None

        merged_label_cat = self.merged_dataset.categories()[dm.AnnotationType.label]
        merged_points_cat = self.merged_dataset.categories()[dm.AnnotationType.points]

        # We need to convert point arrays, which cannot be represented in COCO directly,
        # into the skeletons, compatible with COCO person keypoints, which is the
        # required output format
        converted_job_dataset = annotation_utils.convert_point_arrays_dataset_to_1_point_skeletons(
            dataset, labels=[label.name for label in job_label_cat]
        )

        # Accumulate points into the merged dataset + add boxes
        for job_sample in dataset:
            roi_info = self.roi_name_to_roi_info[os.path.basename(job_sample.id)]

            if merged_skeleton_name is None:
                merged_skeleton_id = self.bbox_label_to_merged[roi_info.bbox_label]
                merged_skeleton_name = self.merged_dataset.categories()[dm.AnnotationType.label][
                    merged_skeleton_id
                ].name

            bbox_sample = self.original_key_to_sample[roi_info.original_image_key]
            assert bbox_sample

            skeleton_sample = self.merged_dataset.get(bbox_sample.id)
            assert skeleton_sample

            image_h, image_w = bbox_sample.image.size

            old_bbox = next(
                bbox
                for bbox in bbox_sample.annotations
                if bbox.id == roi_info.bbox_id
                if isinstance(bbox, dm.Bbox)
            )
            offset_x = old_bbox.x - roi_info.bbox_x
            offset_y = old_bbox.y - roi_info.bbox_y

            merged_skeleton = next(
                (
                    ann
                    for ann in skeleton_sample.annotations
                    if isinstance(ann, dm.Skeleton)
                    if ann.id == roi_info.bbox_id and isinstance(ann, dm.Skeleton)
                ),
                None,
            )
            if not merged_skeleton:
                merged_skeleton = dm.Skeleton(
                    elements=[
                        dm.Points(
                            [0, 0],
                            visibility=[dm.Points.Visibility.absent],
                            label=merged_label_cat.find(
                                point_label,
                                parent=merged_label_cat[
                                    self.bbox_label_to_merged[old_bbox.label]
                                ].name,
                            )[0],
                        )
                        for point_label in merged_points_cat[
                            self.bbox_label_to_merged[old_bbox.label]
                        ].labels
                    ],
                    label=self.bbox_label_to_merged[old_bbox.label],
                    id=old_bbox.id,
                    attributes={skeletons_from_boxes_task.OUTPUT_OBJECT_ID_ATTR: old_bbox.id},
                )
                skeleton_sample.annotations.append(merged_skeleton)

            # TODO: think about discarding invalid annotations (points)
            # e.g. everything beyond the bbox, duplicates, and extra points.
            # For now, just take the first one available, as only 1 must be put by annotators
            job_sample_points = annotation_utils.flatten_points(
                [p for p in job_sample.annotations if isinstance(p, dm.Points)]
            )
            if not job_sample_points:
                continue

            job_point = job_sample_points[0]

            skeleton_point_idx, skeleton_point = next(
                (p_idx, p)
                for p_idx, p in enumerate(merged_skeleton.elements)
                if p.label
                == self.job_point_label_id_to_merged_label_id[
                    (roi_info.bbox_label, job_label_cat[job_point.label].name)
                ]
            )

            skeleton_point = skeleton_point.wrap(
                points=job_point.points[:2], visibility=[job_point.visibility[0]]
            )

            skeleton_point = annotation_utils.shift_ann(
                skeleton_point, offset_x=offset_x, offset_y=offset_y, img_h=image_h, img_w=image_w
            )

            merged_skeleton.elements[skeleton_point_idx] = skeleton_point

            # Append skeleton bbox
            converted_sample = converted_job_dataset.get(job_sample.id, subset=job_sample.subset)
            assert converted_sample

            skeleton_bbox = annotation_utils.shift_ann(
                old_bbox,
                offset_x=-offset_x,
                offset_y=-offset_y,
                img_w=roi_info.roi_w,
                img_h=roi_info.roi_h,
            )

            # Join annotations into a group for correct distance comparison
            skeleton_group = 1
            converted_skeleton = next(
                s for s in converted_sample.annotations if isinstance(s, dm.Skeleton)
            )
            converted_skeleton.group = skeleton_group
            skeleton_bbox.group = skeleton_group
            skeleton_bbox.label = converted_skeleton.label
            converted_job_dataset.put(
                converted_sample.wrap(annotations=[*converted_sample.annotations, skeleton_bbox])
            )

        # Rename the job skeleton and point to the original names
        assert merged_skeleton_name
        converted_label_cat: dm.LabelCategories = converted_job_dataset.categories()[
            dm.AnnotationType.label
        ]
        converted_points_cat: dm.PointsCategories = converted_job_dataset.categories()[
            dm.AnnotationType.points
        ]

        assert len(converted_label_cat) == 2
        converted_skeleton_id, converted_skeleton_label = next(
            (i, c) for i, c in enumerate(converted_label_cat) if not c.parent
        )
        converted_point_label = next(c for c in converted_label_cat if c.parent)

        converted_skeleton_label.name = merged_skeleton_name
        converted_point_label.parent = merged_skeleton_name

        merged_point_label_id = self.job_point_label_id_to_merged_label_id[
            (merged_skeleton_id, converted_point_label.name)
        ]
        converted_point_label.name = self.merged_dataset.categories()[dm.AnnotationType.label][
            merged_point_label_id
        ].name

        converted_points_cat[converted_skeleton_id].labels = [converted_point_label.name]

        converted_label_cat._reindex()

        return converted_job_dataset

    def _process_merged_dataset(self, merged_dataset: Dataset) -> Dataset:
        return merged_dataset

    def _postprocess(self, annotations: Sequence[FileDescriptor]) -> None:
        assert self._merged_annotation_file.file is None

        # Accumulate points from separate job annotations, then export the resulting dataset
        self._init_merged_dataset()

        job_files = [fd for fd in annotations if not self._is_merged_dataset(fd)]
        self._run_pipeline(job_files)

        with TemporaryDirectory() as tempdir:
            export_dir = os.path.join(
                tempdir,
                os.path.splitext(os.path.basename(self._merged_annotation_file.filename))[0]
                + "_conv",
            )

            merged_dataset = self._process_merged_dataset(self.merged_dataset)
            self._export_dataset(merged_dataset, export_dir)

            converted_dataset_archive = io.BytesIO()
            write_dir_to_zip_archive(export_dir, converted_dataset_archive)
            converted_dataset_archive.seek(0)

            self._merged_annotation_file.file = converted_dataset_archive
