import io
import logging
import os
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Dict, List, Optional, Sequence, Tuple, Type, TypeVar, Union

import datumaro as dm
import numpy as np
from attrs import define
from sqlalchemy.orm import Session

import src.core.tasks.boxes_from_points as boxes_from_points_task
import src.core.tasks.skeletons_from_boxes as skeletons_from_boxes_task
import src.services.validation as db_service
from src.core.annotation_meta import AnnotationMeta
from src.core.config import Config
from src.core.manifest import TaskManifest
from src.core.storage import compose_data_bucket_filename
from src.core.types import TaskType
from src.core.validation_meta import JobMeta, ResultMeta, ValidationMeta
from src.services.cloud import make_client as make_cloud_client
from src.services.cloud.utils import BucketAccessInfo
from src.utils.annotations import ProjectLabels, shift_ann
from src.utils.zip_archive import extract_zip_archive, write_dir_to_zip_archive
from src.validation.dataset_comparison import (
    BboxDatasetComparator,
    DatasetComparator,
    PointsDatasetComparator,
    SkeletonDatasetComparator,
)


@define
class ValidationSuccess:
    validation_meta: ValidationMeta
    resulting_annotations: bytes
    average_quality: float


@define
class ValidationFailure:
    rejected_job_ids: List[int]


DM_DATASET_FORMAT_MAPPING = {
    TaskType.image_label_binary: "cvat_images",
    TaskType.image_points: "coco_person_keypoints",
    TaskType.image_boxes: "coco_instances",
    TaskType.image_boxes_from_points: "coco_instances",
    TaskType.image_skeletons_from_boxes: "coco_person_keypoints",
}

DM_GT_DATASET_FORMAT_MAPPING = {
    TaskType.image_label_binary: "cvat_images",
    TaskType.image_points: "coco_instances",  # we compare points against boxes
    TaskType.image_boxes: "coco_instances",
    TaskType.image_boxes_from_points: "coco_instances",
    TaskType.image_skeletons_from_boxes: "coco_person_keypoints",
}


DATASET_COMPARATOR_TYPE_MAP: Dict[TaskType, Type[DatasetComparator]] = {
    # TaskType.image_label_binary: TagDatasetComparator, # TODO: implement if support is needed
    TaskType.image_boxes: BboxDatasetComparator,
    TaskType.image_points: PointsDatasetComparator,
    TaskType.image_boxes_from_points: BboxDatasetComparator,
    TaskType.image_skeletons_from_boxes: SkeletonDatasetComparator,
}

_JobResults = Dict[int, float]
_RejectedJobs = Sequence[int]

T = TypeVar("T")


class _TaskValidator:
    def __init__(
        self,
        escrow_address: str,
        chain_id: int,
        manifest: TaskManifest,
        *,
        job_annotations: Dict[int, io.RawIOBase],
        merged_annotations: Optional[io.RawIOBase] = None,
    ):
        self.escrow_address = escrow_address
        self.chain_id = chain_id
        self.manifest = manifest

        self.job_annotations: Optional[Dict[int, io.IOBase]] = job_annotations
        self.merged_annotations: Optional[io.IOBase] = merged_annotations

        self._temp_dir: Optional[Path] = None
        self._gt_dataset: Optional[dm.Dataset] = None

    def _require_field(self, field: Optional[T]) -> T:
        assert field is not None
        return field

    def _parse_gt(self):
        tempdir = self._require_field(self._temp_dir)
        manifest = self._require_field(self.manifest)

        bucket_info = BucketAccessInfo.from_raw_url(self.manifest.validation.gt_url)
        bucket_client = make_cloud_client(bucket_info.url)
        # TODO: add credentials

        gt_annotations = io.BytesIO(
            bucket_client.download_file(bucket_info.url.bucket_name, bucket_info.url.path)
        )

        gt_dataset_path = tempdir / "gt.json"
        gt_dataset_path.write_bytes(gt_annotations.read())
        self._gt_dataset = dm.Dataset.import_from(
            os.fspath(gt_dataset_path),
            format=DM_GT_DATASET_FORMAT_MAPPING[manifest.annotation.type],
        )

    def _validate_jobs(self):
        tempdir = self._require_field(self._temp_dir)
        manifest = self._require_field(self.manifest)
        gt_dataset = self._require_field(self._gt_dataset)
        job_annotations = self._require_field(self.job_annotations)

        job_results: Dict[int, float] = {}
        rejected_job_ids: List[int] = []

        comparator = DATASET_COMPARATOR_TYPE_MAP[manifest.annotation.type](
            min_similarity_threshold=manifest.validation.min_quality,
        )

        for job_cvat_id, job_annotations_file in job_annotations.items():
            job_dataset_path = tempdir / str(job_cvat_id)
            extract_zip_archive(job_annotations_file, job_dataset_path)

            job_dataset = dm.Dataset.import_from(
                os.fspath(job_dataset_path),
                format=DM_DATASET_FORMAT_MAPPING[manifest.annotation.type],
            )

            job_mean_accuracy = comparator.compare(gt_dataset, job_dataset)
            job_results[job_cvat_id] = job_mean_accuracy

            if job_mean_accuracy < manifest.validation.min_quality:
                rejected_job_ids.append(job_cvat_id)

        self._job_results = job_results
        self._rejected_job_ids = rejected_job_ids

    def _prepare_merged_dataset(self):
        tempdir = self._require_field(self._temp_dir)
        manifest = self._require_field(self.manifest)
        merged_annotations = self._require_field(self.merged_annotations)
        gt_dataset = self._require_field(self._gt_dataset)

        merged_dataset_path = tempdir / "merged"
        merged_dataset_format = DM_DATASET_FORMAT_MAPPING[manifest.annotation.type]
        extract_zip_archive(merged_annotations, merged_dataset_path)

        merged_dataset = dm.Dataset.import_from(
            os.fspath(merged_dataset_path), format=merged_dataset_format
        )
        self._put_gt_into_merged_dataset(gt_dataset, merged_dataset, manifest=manifest)

        updated_merged_dataset_path = tempdir / "merged_updated"
        merged_dataset.export(updated_merged_dataset_path, merged_dataset_format, save_media=False)

        updated_merged_dataset_archive = io.BytesIO()
        write_dir_to_zip_archive(updated_merged_dataset_path, updated_merged_dataset_archive)
        updated_merged_dataset_archive.seek(0)

        self._updated_merged_dataset_archive = updated_merged_dataset_archive

    @classmethod
    def _put_gt_into_merged_dataset(
        cls, gt_dataset: dm.Dataset, merged_dataset: dm.Dataset, *, manifest: TaskManifest
    ):
        """
        Updates the merged dataset inplace, writing GT annotations corresponding to the task type.
        """

        match manifest.annotation.type:
            case TaskType.image_boxes.value:
                merged_dataset.update(gt_dataset)
            case TaskType.image_points.value:
                for sample in gt_dataset:
                    annotations = [
                        # Put a point in the center of each GT bbox
                        # Not ideal, but it's the target for now
                        dm.Points(
                            [bbox.x + bbox.w / 2, bbox.y + bbox.h / 2],
                            label=bbox.label,
                            attributes=bbox.attributes,
                        )
                        for bbox in sample.annotations
                        if isinstance(bbox, dm.Bbox)
                    ]
                    merged_dataset.put(sample.wrap(annotations=annotations))
            case TaskType.image_label_binary.value:
                merged_dataset.update(gt_dataset)
            case TaskType.image_boxes_from_points:
                merged_dataset.update(gt_dataset)
            case TaskType.image_skeletons_from_boxes:
                # The original behavior is broken for skeletons
                gt_dataset = dm.Dataset(gt_dataset)
                gt_dataset = gt_dataset.transform(
                    ProjectLabels, dst_labels=merged_dataset.categories()[dm.AnnotationType.label]
                )
                merged_dataset.update(gt_dataset)
            case _:
                assert False, f"Unknown task type {manifest.annotation.type}"

    def validate(self) -> Tuple[_JobResults, _RejectedJobs, io.BytesIO]:
        with TemporaryDirectory() as tempdir:
            self._temp_dir = Path(tempdir)

            self._parse_gt()

            self._validate_jobs()
            job_results = self._require_field(job_results)
            rejected_job_ids = self._require_field(self._rejected_job_ids)

            self._prepare_merged_dataset()
            updated_merged_dataset_archive = self._require_field(
                self._updated_merged_dataset_archive
            )

        return (
            job_results,
            rejected_job_ids,
            updated_merged_dataset_archive,
        )


class _BoxesFromPointsValidator(_TaskValidator):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        (
            boxes_to_points_mapping,
            roi_filenames,
            roi_infos,
            gt_dataset,
            points_dataset,
        ) = self._download_task_meta()

        self._gt_dataset = gt_dataset
        self._points_dataset = points_dataset

        point_key_to_sample = {
            skeleton.id: sample
            for sample in points_dataset
            for skeleton in sample.annotations
            if isinstance(skeleton, dm.Skeleton)
        }

        self.bbox_key_to_sample = {
            bbox.id: sample
            for sample in gt_dataset
            for bbox in sample.annotations
            if isinstance(bbox, dm.Bbox)
        }

        self.point_key_to_bbox_key = {v: k for k, v in boxes_to_points_mapping.items()}
        self.roi_info_by_id = {roi_info.point_id: roi_info for roi_info in roi_infos}
        self.roi_name_to_roi_info: Dict[str, boxes_from_points_task.RoiInfo] = {
            os.path.splitext(roi_filename)[0]: self.roi_info_by_id[roi_id]
            for roi_id, roi_filename in roi_filenames.items()
        }

        self.point_offset_by_roi_id = {}
        "Offset from new to old coords, (dx, dy)"

        for roi_info in roi_infos:
            point_sample = point_key_to_sample[roi_info.point_id]
            old_point = next(
                skeleton
                for skeleton in point_sample.annotations
                if skeleton.id == roi_info.point_id
                if isinstance(skeleton, dm.Skeleton)
            ).elements[0]
            old_x, old_y = old_point.points[:2]
            offset_x = old_x - roi_info.point_x
            offset_y = old_y - roi_info.point_y
            self.point_offset_by_roi_id[roi_info.point_id] = (offset_x, offset_y)

    def _download_task_meta(self):
        layout = boxes_from_points_task.TaskMetaLayout()
        serializer = boxes_from_points_task.TaskMetaSerializer()

        oracle_data_bucket = BucketAccessInfo.from_raw_url(
            Config.exchange_oracle_storage_config.bucket_url()
        )
        # TODO: add
        # credentials=BucketCredentials()
        "Exchange Oracle's private bucket info"

        storage_client = make_cloud_client(oracle_data_bucket)

        boxes_to_points_mapping = serializer.parse_bbox_point_mapping(
            storage_client.download_file(
                oracle_data_bucket.url.bucket_name,
                compose_data_bucket_filename(
                    self.escrow_address, self.chain_id, layout.BBOX_POINT_MAPPING_FILENAME
                ),
            )
        )

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

        gt_dataset = serializer.parse_gt_annotations(
            storage_client.download_file(
                oracle_data_bucket.url.bucket_name,
                compose_data_bucket_filename(
                    self.escrow_address, self.chain_id, layout.GT_FILENAME
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

        return boxes_to_points_mapping, roi_filenames, rois, gt_dataset, points_dataset

    def _make_gt_dataset_for_job(self, job_dataset: dm.Dataset) -> dm.Dataset:
        job_gt_dataset = dm.Dataset(categories=self._gt_dataset.categories(), media_type=dm.Image)

        for job_sample in job_dataset:
            roi_info = self.roi_name_to_roi_info[os.path.basename(job_sample.id)]

            point_bbox_key = self.point_key_to_bbox_key.get(roi_info.point_id, None)
            if point_bbox_key is None:
                continue  # roi is not from GT set

            bbox_sample = self.bbox_key_to_sample[point_bbox_key]

            bbox = next(bbox for bbox in bbox_sample.annotations if bbox.id == point_bbox_key)
            roi_shift_x, roi_shift_y = self.point_offset_by_roi_id[roi_info.point_id]

            bbox_in_roi_coords = shift_ann(
                bbox,
                offset_x=-roi_shift_x,
                offset_y=-roi_shift_y,
                img_w=roi_info.roi_w,
                img_h=roi_info.roi_h,
            )

            job_gt_dataset.put(job_sample.wrap(annotations=[bbox_in_roi_coords]))

        return job_gt_dataset

    def validate(self) -> Tuple[_JobResults, _RejectedJobs, io.BytesIO]:
        assert self.job_annotations is not None
        assert self.merged_annotations is not None

        manifest = self.manifest
        task_type = manifest.annotation.type
        dataset_format = DM_DATASET_FORMAT_MAPPING[task_type]

        job_annotations = self.job_annotations
        merged_annotations = self.merged_annotations

        job_results: Dict[int, float] = {}
        rejected_job_ids: List[int] = []

        with TemporaryDirectory() as tempdir:
            tempdir = Path(tempdir)

            comparator = DATASET_COMPARATOR_TYPE_MAP[task_type](
                min_similarity_threshold=manifest.validation.min_quality,
            )

            for job_cvat_id, job_annotations_file in job_annotations.items():
                job_dataset_path = tempdir / str(job_cvat_id)
                extract_zip_archive(job_annotations_file, job_dataset_path)

                job_dataset = dm.Dataset.import_from(
                    os.fspath(job_dataset_path), format=dataset_format
                )
                job_gt_dataset = self._make_gt_dataset_for_job(job_dataset)

                job_mean_accuracy = comparator.compare(job_gt_dataset, job_dataset)
                job_results[job_cvat_id] = job_mean_accuracy

                if job_mean_accuracy < manifest.validation.min_quality:
                    rejected_job_ids.append(job_cvat_id)

            merged_dataset_path = tempdir / "merged"
            merged_dataset_format = DM_DATASET_FORMAT_MAPPING[task_type]
            extract_zip_archive(merged_annotations, merged_dataset_path)

            merged_dataset = dm.Dataset.import_from(
                os.fspath(merged_dataset_path), format=merged_dataset_format
            )
            self._put_gt_into_merged_dataset(self._gt_dataset, merged_dataset, manifest=manifest)

            updated_merged_dataset_path = tempdir / "merged_updated"
            merged_dataset.export(
                updated_merged_dataset_path, merged_dataset_format, save_media=False
            )

            updated_merged_dataset_archive = io.BytesIO()
            write_dir_to_zip_archive(updated_merged_dataset_path, updated_merged_dataset_archive)
            updated_merged_dataset_archive.seek(0)

        return (
            job_results,
            rejected_job_ids,
            updated_merged_dataset_archive,
        )


class _SkeletonsFromBoxesValidator(_TaskValidator):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        (
            roi_filenames,
            roi_infos,
            boxes_dataset,
            job_label_mapping,
            gt_dataset,
            skeletons_to_boxes_mapping,
        ) = self._download_task_meta()

        self.boxes_dataset = boxes_dataset
        self.original_key_to_sample = {sample.attributes["id"]: sample for sample in boxes_dataset}

        self.job_label_mapping = job_label_mapping

        self.gt_dataset = gt_dataset

        self.bbox_key_to_sample = {
            bbox.id: sample
            for sample in boxes_dataset
            for bbox in sample.annotations
            if isinstance(bbox, dm.Bbox)
        }

        self.skeleton_key_to_sample = {
            skeleton.id: sample
            for sample in gt_dataset
            for skeleton in sample.annotations
            if isinstance(skeleton, dm.Skeleton)
        }

        self.bbox_key_to_skeleton_key = {v: k for k, v in skeletons_to_boxes_mapping.items()}
        self.roi_info_by_id = {roi_info.bbox_id: roi_info for roi_info in roi_infos}
        self.roi_name_to_roi_info: Dict[str, skeletons_from_boxes_task.RoiInfo] = {
            os.path.splitext(roi_filename)[0]: self.roi_info_by_id[roi_id]
            for roi_id, roi_filename in roi_filenames.items()
        }

        self.bbox_offset_by_roi_id = {}
        "Offset from old to new coords, (dx, dy)"

        for roi_info in roi_infos:
            bbox_sample = self.bbox_key_to_sample[roi_info.bbox_id]

            old_bbox = next(
                bbox
                for bbox in bbox_sample.annotations
                if bbox.id == roi_info.bbox_id
                if isinstance(bbox, dm.Bbox)
            )
            offset_x = roi_info.bbox_x - old_bbox.x
            offset_y = roi_info.bbox_y - old_bbox.y

            self.bbox_offset_by_roi_id[roi_info.bbox_id] = (offset_x, offset_y)

    def _download_task_meta(self):
        layout = skeletons_from_boxes_task.TaskMetaLayout()
        serializer = skeletons_from_boxes_task.TaskMetaSerializer()

        oracle_data_bucket = BucketAccessInfo.from_raw_url(
            Config.exchange_oracle_storage_config.bucket_url()
        )
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

        gt_dataset = serializer.parse_gt_annotations(
            storage_client.download_file(
                oracle_data_bucket.url.bucket_name,
                compose_data_bucket_filename(
                    self.escrow_address, self.chain_id, layout.GT_FILENAME
                ),
            )
        )

        skeletons_to_boxes_mapping = serializer.parse_skeleton_bbox_mapping(
            storage_client.download_file(
                oracle_data_bucket.url.bucket_name,
                compose_data_bucket_filename(
                    self.escrow_address, self.chain_id, layout.SKELETON_BBOX_MAPPING_FILENAME
                ),
            )
        )

        return (
            roi_filenames,
            rois,
            boxes_dataset,
            job_label_mapping,
            gt_dataset,
            skeletons_to_boxes_mapping,
        )

    def _make_gt_dataset_for_job(self, job_id: int, job_dataset: dm.Dataset) -> dm.Dataset:
        job_label_cat: dm.LabelCategories = job_dataset.categories()[dm.AnnotationType.label]
        assert len(job_label_cat) == 2
        job_skeleton_label_id, job_skeleton_label = next(
            (i, c) for i, c in enumerate(job_label_cat) if not c.parent
        )
        job_point_label_id, job_point_label = next(
            (i, c) for i, c in enumerate(job_label_cat) if c.parent
        )

        gt_label_cat = self.gt_dataset.categories()[dm.AnnotationType.label]
        gt_point_label_id = gt_label_cat.find(job_point_label.name, parent=job_skeleton_label.name)[
            0
        ]

        job_gt_dataset = dm.Dataset(categories=job_dataset.categories(), media_type=dm.Image)
        for job_sample in job_dataset:
            roi_info = self.roi_name_to_roi_info[os.path.basename(job_sample.id)]

            gt_skeleton_key = self.bbox_key_to_skeleton_key.get(roi_info.bbox_id, None)
            if gt_skeleton_key is None:
                continue  # roi is not from GT set

            bbox_sample = self.bbox_key_to_sample[roi_info.bbox_id]
            bbox = next(
                bbox
                for bbox in bbox_sample.annotations
                if bbox.id == roi_info.bbox_id
                if isinstance(bbox, dm.Bbox)
            )

            gt_sample = self.skeleton_key_to_sample[gt_skeleton_key]
            gt_skeleton = next(
                skeleton
                for skeleton in gt_sample.annotations
                if skeleton.id == gt_skeleton_key
                if isinstance(skeleton, dm.Skeleton)
            )

            roi_shift_x, roi_shift_y = self.bbox_offset_by_roi_id[roi_info.bbox_id]
            converted_gt_skeleton = shift_ann(
                gt_skeleton,
                offset_x=roi_shift_x,
                offset_y=roi_shift_y,
                img_w=roi_info.roi_w,
                img_h=roi_info.roi_h,
            )
            converted_bbox = shift_ann(
                bbox,
                offset_x=roi_shift_x,
                offset_y=roi_shift_y,
                img_w=roi_info.roi_w,
                img_h=roi_info.roi_h,
            )

            # Join annotations into a group for correct distance comparison
            skeleton_group = 1
            converted_bbox.group = skeleton_group
            converted_gt_skeleton.group = skeleton_group

            # Convert labels
            converted_gt_skeleton.label = job_skeleton_label_id
            converted_gt_skeleton.elements = [
                p.wrap(label=job_point_label_id)
                for p in converted_gt_skeleton.elements
                if p.label == gt_point_label_id
            ]

            job_gt_dataset.put(job_sample.wrap(annotations=[converted_gt_skeleton, converted_bbox]))

        return job_gt_dataset

    def validate(self) -> Tuple[_JobResults, _RejectedJobs, io.BytesIO]:
        assert self.job_annotations is not None
        assert self.merged_annotations is not None

        manifest = self.manifest
        task_type = manifest.annotation.type
        dataset_format = DM_DATASET_FORMAT_MAPPING[task_type]

        job_annotations = self.job_annotations
        merged_annotations = self.merged_annotations

        job_results: Dict[int, float] = {}
        rejected_job_ids: List[int] = []

        with TemporaryDirectory() as tempdir:
            tempdir = Path(tempdir)

            comparator = DATASET_COMPARATOR_TYPE_MAP[task_type](
                min_similarity_threshold=manifest.validation.min_quality
            )

            for job_cvat_id, job_annotations_file in job_annotations.items():
                job_dataset_path = tempdir / str(job_cvat_id)
                extract_zip_archive(job_annotations_file, job_dataset_path)

                job_dataset = dm.Dataset.import_from(
                    os.fspath(job_dataset_path), format=dataset_format
                )
                job_gt_dataset = self._make_gt_dataset_for_job(job_cvat_id, job_dataset)

                job_mean_accuracy = comparator.compare(job_gt_dataset, job_dataset)
                job_results[job_cvat_id] = job_mean_accuracy

                if job_mean_accuracy < manifest.validation.min_quality:
                    rejected_job_ids.append(job_cvat_id)

            merged_dataset_path = tempdir / "merged"
            merged_dataset_format = DM_DATASET_FORMAT_MAPPING[task_type]
            extract_zip_archive(merged_annotations, merged_dataset_path)

            merged_dataset = dm.Dataset.import_from(
                os.fspath(merged_dataset_path), format=merged_dataset_format
            )
            self._put_gt_into_merged_dataset(self.gt_dataset, merged_dataset, manifest=manifest)

            updated_merged_dataset_path = tempdir / "merged_updated"
            merged_dataset.export(
                updated_merged_dataset_path, merged_dataset_format, save_media=False
            )

            updated_merged_dataset_archive = io.BytesIO()
            write_dir_to_zip_archive(updated_merged_dataset_path, updated_merged_dataset_archive)
            updated_merged_dataset_archive.seek(0)

        return (
            job_results,
            rejected_job_ids,
            updated_merged_dataset_archive,
        )


def process_intermediate_results(
    session: Session,
    *,
    escrow_address: str,
    chain_id: int,
    meta: AnnotationMeta,
    job_annotations: Dict[int, io.RawIOBase],
    merged_annotations: io.RawIOBase,
    manifest: TaskManifest,
    logger: logging.Logger,
) -> Union[ValidationSuccess, ValidationFailure]:
    # validate
    task_type = manifest.annotation.type
    if task_type in [TaskType.image_label_binary, TaskType.image_boxes, TaskType.image_points]:
        validator_type = _TaskValidator
    elif task_type == TaskType.image_boxes_from_points:
        validator_type = _BoxesFromPointsValidator
    elif task_type == TaskType.image_skeletons_from_boxes:
        validator_type = _SkeletonsFromBoxesValidator
    else:
        raise Exception(f"Unknown task type {task_type}")

    validator = validator_type(
        escrow_address=escrow_address,
        chain_id=chain_id,
        manifest=manifest,
        job_annotations=job_annotations,
        merged_annotations=merged_annotations,
    )
    job_results, rejected_job_ids, updated_merged_dataset_archive = validator.validate()

    if logger.isEnabledFor(logging.DEBUG):
        logger.debug(
            "Task validation results for escrow_address=%s: %s",
            escrow_address,
            ", ".join(f"{k}: {v:.2f}" for k, v in job_results.items()),
        )

    task = db_service.get_task_by_escrow_address(session, escrow_address, for_update=True)
    if not task:
        task_id = db_service.create_task(session, escrow_address=escrow_address, chain_id=chain_id)
        task = db_service.get_task_by_id(session, task_id, for_update=True)

    job_final_result_ids: Dict[int, str] = {}
    for job_meta in meta.jobs:
        job = db_service.get_job_by_cvat_id(session, job_meta.job_id)
        if not job:
            job_id = db_service.create_job(session, task_id=task.id, job_cvat_id=job_meta.job_id)
            job = db_service.get_job_by_id(session, job_id)

        validation_result = db_service.get_validation_result_by_assignment_id(
            session, job_meta.assignment_id
        )
        if not validation_result:
            validation_result_id = db_service.create_validation_result(
                session,
                job_id=job.id,
                annotator_wallet_address=job_meta.annotator_wallet_address,
                annotation_quality=job_results[job_meta.job_id],
                assignment_id=job_meta.assignment_id,
            )
        else:
            validation_result_id = validation_result.id

        job_final_result_ids[job.id] = validation_result_id

    if rejected_job_ids:
        return ValidationFailure(rejected_job_ids)

    task_jobs = task.jobs
    task_validation_results = db_service.get_task_validation_results(session, task.id)

    job_id_to_meta_id = {job.id: i for i, job in enumerate(task_jobs)}

    validation_result_id_to_meta_id = {r.id: i for i, r in enumerate(task_validation_results)}

    validation_meta = ValidationMeta(
        jobs=[
            JobMeta(
                job_id=job_id_to_meta_id[job.id],
                final_result_id=validation_result_id_to_meta_id[job_final_result_ids[job.id]],
            )
            for job in task_jobs
        ],
        results=[
            ResultMeta(
                id=validation_result_id_to_meta_id[r.id],
                job_id=job_id_to_meta_id[r.job.id],
                annotator_wallet_address=r.annotator_wallet_address,
                annotation_quality=r.annotation_quality,
            )
            for r in task_validation_results
        ],
    )

    return ValidationSuccess(
        validation_meta=validation_meta,
        resulting_annotations=updated_merged_dataset_archive.getvalue(),
        average_quality=np.mean(list(job_results.values())) if job_results else 0,
    )


def parse_annotation_metafile(metafile: io.RawIOBase) -> AnnotationMeta:
    return AnnotationMeta.parse_raw(metafile.read())


def serialize_validation_meta(validation_meta: ValidationMeta) -> bytes:
    return validation_meta.json().encode()
