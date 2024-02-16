import io
import os
import zipfile
from tempfile import TemporaryDirectory
from typing import Dict, List, Type

import datumaro as dm
from attrs import define
from datumaro.components.dataset import Dataset

import src.core.tasks.boxes_from_points as boxes_from_points_task
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
}

CVAT_EXPORT_FORMAT_TO_DM_MAPPING = {
    "CVAT for images 1.1": "cvat",
    "COCO 1.0": "coco_instances",
}


@define
class FileDescriptor:
    filename: str
    file: io.RawIOBase


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
        self.annotations = annotations
        self.merged_annotation = merged_annotation
        self.manifest = manifest
        self.project_images = project_images

        self.input_format = CVAT_EXPORT_FORMAT_TO_DM_MAPPING[
            CVAT_EXPORT_FORMAT_MAPPING[manifest.annotation.type]
        ]
        self.output_format = DM_DATASET_FORMAT_MAPPING[manifest.annotation.type]

    def process(self):
        with TemporaryDirectory() as tempdir:
            for ann_descriptor in self.annotations:
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

        if ann_descriptor.filename == self.merged_annotation.filename:
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

        oracle_data_bucket = BucketAccessInfo.parse_obj(Config.storage_config)
        storage_client = make_cloud_client(oracle_data_bucket)

        roi_filenames = serializer.parse_roi_filenames(
            storage_client.download_fileobj(
                compose_data_bucket_filename(
                    self.escrow_address, self.chain_id, layout.ROI_FILENAMES_FILENAME
                ),
            )
        )

        rois = serializer.parse_roi_info(
            storage_client.download_fileobj(
                compose_data_bucket_filename(
                    self.escrow_address, self.chain_id, layout.ROI_INFO_FILENAME
                ),
            )
        )

        points_dataset = serializer.parse_points_annotations(
            storage_client.download_fileobj(
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
    }

    # TODO: restore original filenames and merge skeletons from RoIs (skeletons from boxes task)

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
