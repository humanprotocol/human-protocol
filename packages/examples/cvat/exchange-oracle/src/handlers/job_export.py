import io
import os
import zipfile
from dataclasses import dataclass
from tempfile import TemporaryDirectory
from typing import Dict, List, Optional, Type

import datumaro as dm
from datumaro.components.dataset import Dataset

import src.core.tasks.boxes_from_points as boxes_from_points_task
import src.core.tasks.skeletons_from_boxes as skeletons_from_boxes_task
import src.utils.annotations as annotation_utils
from src.core.annotation_meta import ANNOTATION_RESULTS_METAFILE_NAME, AnnotationMeta, JobMeta
from src.core.config import Config
from src.core.manifest import TaskManifest
from src.core.storage import compose_data_bucket_filename
from src.core.types import TaskType
from src.handlers.job_creation import DM_DATASET_FORMAT_MAPPING
from src.models.cvat import Image, Job
from src.services.cloud import make_client as make_cloud_client
from src.services.cloud.utils import BucketAccessInfo
from src.utils.zip_archive import extract_zip_archive, write_dir_to_zip_archive

CVAT_EXPORT_FORMAT_MAPPING = {
    TaskType.image_label_binary: "CVAT for images 1.1",
    TaskType.image_points: "CVAT for images 1.1",
    TaskType.image_boxes: "COCO 1.0",
    TaskType.image_boxes_from_points: "COCO 1.0",
    TaskType.image_skeletons_from_boxes: "CVAT for images 1.1",
}

CVAT_EXPORT_FORMAT_TO_DM_MAPPING = {
    "CVAT for images 1.1": "cvat",
    "COCO 1.0": "coco_instances",
}


@dataclass
class FileDescriptor:
    filename: str
    file: Optional[io.RawIOBase]


def prepare_annotation_metafile(
    jobs: List[Job], job_annotations: Dict[int, FileDescriptor]
) -> FileDescriptor:
    """
    Prepares a task/project annotation descriptor file with annotator mapping.
    """

    meta = AnnotationMeta(
        jobs=[
            JobMeta(
                job_id=job.cvat_id,
                annotation_filename=job_annotations[job.cvat_id].filename,
                annotator_wallet_address=job.latest_assignment.user_wallet_address,
                assignment_id=job.latest_assignment.id,
            )
            for job in jobs
        ]
    )

    return FileDescriptor(ANNOTATION_RESULTS_METAFILE_NAME, file=io.BytesIO(meta.json().encode()))


class _TaskProcessor:
    def __init__(
        self,
        escrow_address: str,
        chain_id: int,
        annotations: List[FileDescriptor],
        merged_annotation: FileDescriptor,
        *,
        manifest: TaskManifest,
        project_images: List[Image],
    ):
        self.escrow_address = escrow_address
        self.chain_id = chain_id
        self.annotation_files = annotations
        self.merged_annotation_file = merged_annotation
        self.manifest = manifest
        self.project_images = project_images

        self.input_format = CVAT_EXPORT_FORMAT_TO_DM_MAPPING[
            CVAT_EXPORT_FORMAT_MAPPING[manifest.annotation.type]
        ]
        self.output_format = DM_DATASET_FORMAT_MAPPING[manifest.annotation.type]

    def _is_merged_dataset(self, ann_descriptor: FileDescriptor) -> bool:
        return ann_descriptor == self.merged_annotation_file

    def process(self):
        with TemporaryDirectory() as tempdir:
            for ann_descriptor in self.annotation_files:
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

    def _process_annotation_file(
        self, ann_descriptor: FileDescriptor, input_dir: str, output_dir: str
    ):
        input_dataset = self._parse_dataset(ann_descriptor, input_dir)
        output_dataset = self._process_dataset(input_dataset, ann_descriptor=ann_descriptor)
        self._export_dataset(output_dataset, output_dir)

    def _parse_dataset(self, ann_descriptor: FileDescriptor, dataset_dir: str) -> dm.Dataset:
        return dm.Dataset.import_from(dataset_dir, self.input_format)

    def _export_dataset(self, dataset: dm.Dataset, output_dir: str):
        dataset.export(output_dir, self.output_format, save_images=False)

    def _process_dataset(
        self, dataset: dm.Dataset, *, ann_descriptor: FileDescriptor
    ) -> dm.Dataset:
        # TODO: remove complete duplicates in annotations

        if self._is_merged_dataset(ann_descriptor):
            dataset = self._process_merged_dataset(dataset)

        return dataset

    def _process_merged_dataset(self, input_dataset: dm.Dataset) -> dm.Dataset:
        return annotation_utils.remove_duplicated_gt_frames(
            input_dataset,
            known_frames=[image.filename for image in self.project_images],
        )


class _LabelsTaskProcessor(_TaskProcessor):
    pass


class _BoxesTaskProcessor(_TaskProcessor):
    pass


class _PointsTaskProcessor(_TaskProcessor):
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


class _BoxesFromPointsTaskProcessor(_TaskProcessor):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        roi_filenames, roi_infos, points_dataset = self._download_task_meta()

        self.points_dataset = points_dataset
        self.original_key_to_sample = {sample.attributes["id"]: sample for sample in points_dataset}

        roi_info_by_id = {roi_info.point_id: roi_info for roi_info in roi_infos}

        self.roi_name_to_roi_info: Dict[str, boxes_from_points_task.RoiInfo] = {
            os.path.splitext(roi_filename)[0]: roi_info_by_id[roi_id]
            for roi_id, roi_filename in roi_filenames.items()
        }

    def _download_task_meta(self):
        layout = boxes_from_points_task.TaskMetaLayout()
        serializer = boxes_from_points_task.TaskMetaSerializer()

        oracle_data_bucket = BucketAccessInfo.from_raw_url(Config.storage_config.bucket_url())
        # TODO: add
        # credentials=BucketCredentials()
        "Exchange Oracle's private bucket info"

        storage_client = make_cloud_client(oracle_data_bucket)

        roi_filenames = serializer.parse_roi_filenames(
            storage_client.download_file(
                oracle_data_bucket.url.bucket_name,
                compose_data_bucket_filename(
                    self.escrow_address, self.chain_id, layout.ROI_FILENAMES_FILENAME
                ),
            )
        )

        rois = serializer.parse_roi_info(
            storage_client.download_file(
                oracle_data_bucket.url.bucket_name,
                compose_data_bucket_filename(
                    self.escrow_address, self.chain_id, layout.ROI_INFO_FILENAME
                ),
            )
        )

        points_dataset = serializer.parse_points_annotations(
            storage_client.download_file(
                oracle_data_bucket.url.bucket_name,
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

            merged_sample.annotations.extend(
                annotation_utils.shift_ann(
                    roi_ann,
                    offset_x=old_x - roi_info.point_x,
                    offset_y=old_y - roi_info.point_y,
                    img_w=image_w,
                    img_h=image_h,
                )
                for roi_ann in roi_sample.annotations
                if isinstance(roi_ann, dm.Bbox)
            )

        return merged_sample_dataset


class _SkeletonsFromBoxesTaskProcessor(_TaskProcessor):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        roi_filenames, roi_infos, boxes_dataset, job_label_mapping = self._download_task_meta()

        self.boxes_dataset = boxes_dataset
        self.original_key_to_sample = {sample.attributes["id"]: sample for sample in boxes_dataset}

        roi_info_by_id = {roi_info.bbox_id: roi_info for roi_info in roi_infos}

        self.roi_name_to_roi_info: Dict[str, skeletons_from_boxes_task.RoiInfo] = {
            os.path.splitext(roi_filename)[0]: roi_info_by_id[roi_id]
            for roi_id, roi_filename in roi_filenames.items()
        }

        self.job_label_mapping = job_label_mapping

    def _download_task_meta(self):
        layout = skeletons_from_boxes_task.TaskMetaLayout()
        serializer = skeletons_from_boxes_task.TaskMetaSerializer()

        oracle_data_bucket = BucketAccessInfo.from_raw_url(Config.storage_config.bucket_url())
        # TODO: add
        # credentials=BucketCredentials()
        "Exchange Oracle's private bucket info"

        storage_client = make_cloud_client(oracle_data_bucket)

        roi_filenames = serializer.parse_roi_filenames(
            storage_client.download_file(
                oracle_data_bucket.url.bucket_name,
                compose_data_bucket_filename(
                    self.escrow_address, self.chain_id, layout.ROI_FILENAMES_FILENAME
                ),
            )
        )

        rois = serializer.parse_roi_info(
            storage_client.download_file(
                oracle_data_bucket.url.bucket_name,
                compose_data_bucket_filename(
                    self.escrow_address, self.chain_id, layout.ROI_INFO_FILENAME
                ),
            )
        )

        boxes_dataset = serializer.parse_bbox_annotations(
            storage_client.download_file(
                oracle_data_bucket.url.bucket_name,
                compose_data_bucket_filename(
                    self.escrow_address, self.chain_id, layout.BOXES_FILENAME
                ),
            )
        )

        job_label_mapping = serializer.parse_point_labels(
            storage_client.download_file(
                oracle_data_bucket.url.bucket_name,
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
            self.merged_dataset.put(
                bbox_sample.wrap(
                    annotations=[
                        dm.Skeleton(
                            elements=[
                                dm.Points(
                                    [0, 0],
                                    visibility=[dm.Points.Visibility.hidden],
                                    label=label_cat.find(
                                        point_label,
                                        parent=label_cat[bbox_label_to_merged[bbox.label]].name,
                                    )[0],
                                )
                                for point_label in points_cat[
                                    bbox_label_to_merged[bbox.label]
                                ].labels
                            ],
                            label=bbox_label_to_merged[bbox.label],
                            id=bbox.id,
                        )
                        for bbox in bbox_sample.annotations
                        if isinstance(bbox, dm.Bbox)
                    ]
                )
            )

    def _parse_dataset(self, ann_descriptor: FileDescriptor, dataset_dir: str) -> Dataset:
        annotation_utils.prepare_cvat_annotations_for_dm(dataset_dir)
        return super()._parse_dataset(ann_descriptor, dataset_dir)

    def _process_dataset(self, dataset: Dataset, *, ann_descriptor: FileDescriptor) -> Dataset:
        # We need to convert point arrays, which cannot be represented in COCO directly,
        # into the 1-point skeletons, compatible with COCO person keypoints, which is the
        # required output format

        job_label_cat = dataset.categories()[dm.AnnotationType.label]

        for point_sample in dataset:
            roi_info = self.roi_name_to_roi_info[os.path.basename(point_sample.id)]

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

            skeleton = next(
                ann
                for ann in skeleton_sample.annotations
                if isinstance(ann, dm.Skeleton)
                if ann.id == roi_info.bbox_id and isinstance(ann, dm.Skeleton)
            )

            # TODO: think about discarding invalid annotations (points)
            # For now, just take the first one available, as only 1 must be put by annotators
            point_sample_points = annotation_utils.flatten_points(
                [p for p in point_sample.annotations if isinstance(p, dm.Points)]
            )
            if not point_sample_points:
                continue

            annotated_point = point_sample_points[0]

            skeleton_point_idx, skeleton_point = next(
                (p_idx, p)
                for p_idx, p in enumerate(skeleton.elements)
                if p.label
                == self.job_point_label_id_to_merged_label_id[
                    (roi_info.bbox_label, job_label_cat[annotated_point.label].name)
                ]
            )

            skeleton_point.points[:2] = annotated_point.points[:2]
            skeleton_point.visibility[0] = annotated_point.visibility[0]

            skeleton.elements[skeleton_point_idx] = annotation_utils.shift_ann(
                skeleton_point, offset_x=offset_x, offset_y=offset_y, img_h=image_h, img_w=image_w
            )

        return super()._process_dataset(dataset, ann_descriptor=ann_descriptor)

    def _process_merged_dataset(self, merged_dataset: Dataset) -> Dataset:
        return merged_dataset

    def process(self):
        assert self.merged_annotation_file.file is None

        # Accumulate points from separate job annotations, then export the resulting dataset
        self._init_merged_dataset()

        self.annotation_files = [
            fd for fd in self.annotation_files if not self._is_merged_dataset(fd)
        ]
        super().process()
        self.annotation_files.append(self.merged_annotation_file)

        with TemporaryDirectory() as tempdir:
            export_dir = os.path.join(
                tempdir,
                os.path.splitext(os.path.basename(self.merged_annotation_file.filename))[0]
                + "_conv",
            )

            merged_dataset = self._process_merged_dataset(self.merged_dataset)
            self._export_dataset(merged_dataset, export_dir)

            converted_dataset_archive = io.BytesIO()
            write_dir_to_zip_archive(export_dir, converted_dataset_archive)
            converted_dataset_archive.seek(0)

            self.merged_annotation_file.file = converted_dataset_archive


def postprocess_annotations(
    escrow_address: str,
    chain_id: int,
    annotations: List[FileDescriptor],
    merged_annotation: FileDescriptor,
    *,
    manifest: TaskManifest,
    project_images: List[Image],
) -> None:
    """
    Processes annotations and updates the files list inplace
    """
    processor_classes: Dict[TaskType, Type[_TaskProcessor]] = {
        TaskType.image_label_binary: _LabelsTaskProcessor,
        TaskType.image_boxes: _BoxesTaskProcessor,
        TaskType.image_points: _PointsTaskProcessor,
        TaskType.image_boxes_from_points: _BoxesFromPointsTaskProcessor,
        TaskType.image_skeletons_from_boxes: _SkeletonsFromBoxesTaskProcessor,
    }

    task_type = manifest.annotation.type
    processor = processor_classes[task_type](
        escrow_address=escrow_address,
        chain_id=chain_id,
        annotations=annotations,
        merged_annotation=merged_annotation,
        manifest=manifest,
        project_images=project_images,
    )
    processor.process()
