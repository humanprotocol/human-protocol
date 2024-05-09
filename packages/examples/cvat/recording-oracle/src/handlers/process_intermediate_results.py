from __future__ import annotations

import io
import logging
import os
from dataclasses import dataclass, field
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Dict, NamedTuple, Optional, Set, Type, TypeVar, Union

import datumaro as dm
import numpy as np
from sqlalchemy.orm import Session

import src.core.tasks.boxes_from_points as boxes_from_points_task
import src.core.tasks.simple as simple_task
import src.core.tasks.skeletons_from_boxes as skeletons_from_boxes_task
import src.services.validation as db_service
from src.core.annotation_meta import AnnotationMeta
from src.core.config import Config
from src.core.manifest import TaskManifest
from src.core.storage import compose_data_bucket_filename
from src.core.types import TaskTypes
from src.core.validation_errors import DatasetValidationError, LowAccuracyError
from src.core.validation_meta import JobMeta, ResultMeta, ValidationMeta
from src.core.validation_results import ValidationFailure, ValidationSuccess
from src.db.utils import ForUpdateParams
from src.services.cloud import make_client as make_cloud_client
from src.services.cloud.utils import BucketAccessInfo
from src.utils.annotations import ProjectLabels, shift_ann
from src.utils.zip_archive import extract_zip_archive, write_dir_to_zip_archive
from src.validation.dataset_comparison import (
    BboxDatasetComparator,
    DatasetComparator,
    PointsDatasetComparator,
    SkeletonDatasetComparator,
    TooFewGtError,
)

DM_DATASET_FORMAT_MAPPING = {
    TaskTypes.image_label_binary: "cvat_images",
    TaskTypes.image_points: "coco_person_keypoints",
    TaskTypes.image_boxes: "coco_instances",
    TaskTypes.image_boxes_from_points: "coco_instances",
    TaskTypes.image_skeletons_from_boxes: "coco_person_keypoints",
}

DM_GT_DATASET_FORMAT_MAPPING = {
    TaskTypes.image_label_binary: "cvat_images",
    TaskTypes.image_points: "coco_instances",  # we compare points against boxes
    TaskTypes.image_boxes: "coco_instances",
    TaskTypes.image_boxes_from_points: "coco_instances",
    TaskTypes.image_skeletons_from_boxes: "coco_person_keypoints",
}


DATASET_COMPARATOR_TYPE_MAP: Dict[TaskTypes, Type[DatasetComparator]] = {
    # TaskType.image_label_binary: TagDatasetComparator, # TODO: implement if support is needed
    TaskTypes.image_boxes: BboxDatasetComparator,
    TaskTypes.image_points: PointsDatasetComparator,
    TaskTypes.image_boxes_from_points: BboxDatasetComparator,
    TaskTypes.image_skeletons_from_boxes: SkeletonDatasetComparator,
}

_JobResults = Dict[int, float]

_RejectedJobs = Dict[int, DatasetValidationError]

_FailedGtAttempts = Dict[str, int]
"gt key -> attempts"


@dataclass
class _UpdatedFailedGtInfo:
    failed_jobs: Set[int] = field(default_factory=set)
    occurrences: int = 0


_UpdatedFailedGtStats = Dict[str, _UpdatedFailedGtInfo]


@dataclass
class _ValidationResult:
    job_results: _JobResults
    rejected_jobs: _RejectedJobs
    updated_merged_dataset: io.BytesIO
    updated_gt_stats: _UpdatedFailedGtStats


T = TypeVar("T")


class _TaskValidator:
    UNKNOWN_QUALITY = -1
    "The value to be used when job quality cannot be computed (e.g. no GT images available)"

    def __init__(
        self,
        escrow_address: str,
        chain_id: int,
        manifest: TaskManifest,
        *,
        job_annotations: Dict[int, io.IOBase],
        merged_annotations: io.IOBase,
        gt_stats: Optional[_FailedGtAttempts] = None,
    ):
        self.escrow_address = escrow_address
        self.chain_id = chain_id
        self.manifest = manifest

        self._initial_gt_attempts: _FailedGtAttempts = gt_stats or {}
        self._job_annotations: Dict[int, io.IOBase] = job_annotations
        self._merged_annotations: io.IOBase = merged_annotations

        self._updated_merged_dataset_archive: Optional[io.IOBase] = None
        self._updated_gt_stats: Optional[_UpdatedFailedGtStats] = None
        self._job_results: Optional[_JobResults] = None
        self._rejected_jobs: Optional[_RejectedJobs] = None

        self._temp_dir: Optional[Path] = None
        self._gt_dataset: Optional[dm.Dataset] = None

    def _require_field(self, field: Optional[T]) -> T:
        assert field is not None
        return field

    def _get_gt_weight(self, failed_attempts: int) -> float:
        ban_threshold = Config.validation.gt_ban_threshold

        weight = 1
        if ban_threshold < failed_attempts:
            weight = 0

        return weight

    def _get_gt_weights(self) -> Dict[str, float]:
        weights = {}

        ban_threshold = Config.validation.gt_ban_threshold
        if not ban_threshold:
            return weights

        for gt_key, attempts in self._initial_gt_attempts.items():
            sample_id = self._gt_key_to_sample_id(gt_key)
            weights[sample_id] = self._get_gt_weight(attempts)

        return weights

    def _gt_key_to_sample_id(self, gt_key: str) -> str:
        return gt_key

    def _parse_gt(self):
        layout = simple_task.TaskMetaLayout()
        serializer = simple_task.TaskMetaSerializer()

        oracle_data_bucket = BucketAccessInfo.parse_obj(Config.exchange_oracle_storage_config)
        storage_client = make_cloud_client(oracle_data_bucket)

        self._gt_dataset = serializer.parse_gt_annotations(
            storage_client.download_file(
                compose_data_bucket_filename(
                    self.escrow_address, self.chain_id, layout.GT_FILENAME
                ),
            )
        )

    def _load_job_dataset(self, job_id: int, job_dataset_path: Path) -> dm.Dataset:
        manifest = self._require_field(self.manifest)

        return dm.Dataset.import_from(
            os.fspath(job_dataset_path),
            format=DM_DATASET_FORMAT_MAPPING[manifest.annotation.type],
        )

    def _validate_jobs(self):
        tempdir = self._require_field(self._temp_dir)
        manifest = self._require_field(self.manifest)
        gt_dataset = self._require_field(self._gt_dataset)
        job_annotations = self._require_field(self._job_annotations)

        job_results: _JobResults = {}
        rejected_jobs: _RejectedJobs = {}
        updated_gt_stats: _UpdatedFailedGtStats = {}

        comparator = DATASET_COMPARATOR_TYPE_MAP[manifest.annotation.type](
            min_similarity_threshold=manifest.validation.min_quality,
            gt_weights=self._get_gt_weights(),
        )

        for job_cvat_id, job_annotations_file in job_annotations.items():
            job_dataset_path = tempdir / str(job_cvat_id)
            extract_zip_archive(job_annotations_file, job_dataset_path)

            job_dataset = self._load_job_dataset(job_cvat_id, job_dataset_path)

            try:
                job_mean_accuracy = comparator.compare(gt_dataset, job_dataset)
            except TooFewGtError as e:
                job_results[job_cvat_id] = self.self.UNKNOWN_QUALITY
                rejected_jobs[job_cvat_id] = e
                continue

            job_results[job_cvat_id] = job_mean_accuracy

            for gt_sample in gt_dataset:
                updated_gt_stats.setdefault(gt_sample.id, _UpdatedFailedGtInfo()).occurrences += 1

            for sample_id in comparator.failed_gts:
                updated_gt_stats[sample_id].failed_jobs.add(job_cvat_id)

            if job_mean_accuracy < manifest.validation.min_quality:
                rejected_jobs[job_cvat_id] = LowAccuracyError()

        self._updated_gt_stats = updated_gt_stats
        self._job_results = job_results
        self._rejected_jobs = rejected_jobs

    def _restore_original_image_paths(self, merged_dataset: dm.Dataset) -> dm.Dataset:
        class RemoveCommonPrefix(dm.ItemTransform):
            def __init__(self, extractor: dm.IExtractor, *, prefix: str):
                super().__init__(extractor)
                self._prefix = prefix

            def transform_item(self, item: dm.DatasetItem) -> dm.DatasetItem:
                if item.id.startswith(self._prefix):
                    item = item.wrap(id=item.id[len(self._prefix) :])
                return item

        prefix = self.manifest.data.data_url.path.lstrip("/\\") + "/"
        if all(sample.id.startswith(prefix) for sample in merged_dataset):
            merged_dataset.transform(RemoveCommonPrefix, prefix=prefix)

        return merged_dataset

    def _prepare_merged_dataset(self):
        tempdir = self._require_field(self._temp_dir)
        manifest = self._require_field(self.manifest)
        merged_annotations = self._require_field(self._merged_annotations)
        gt_dataset = self._require_field(self._gt_dataset)

        merged_dataset_path = tempdir / "merged"
        merged_dataset_format = DM_DATASET_FORMAT_MAPPING[manifest.annotation.type]
        extract_zip_archive(merged_annotations, merged_dataset_path)

        merged_dataset = dm.Dataset.import_from(
            os.fspath(merged_dataset_path), format=merged_dataset_format
        )
        self._put_gt_into_merged_dataset(gt_dataset, merged_dataset, manifest=manifest)
        self._restore_original_image_paths(merged_dataset)

        updated_merged_dataset_path = tempdir / "merged_updated"
        merged_dataset.export(
            updated_merged_dataset_path, merged_dataset_format, save_media=False, reindex=True
        )

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
            case TaskTypes.image_boxes.value:
                merged_dataset.update(gt_dataset)
            case TaskTypes.image_points.value:
                merged_label_cat: dm.LabelCategories = merged_dataset.categories()[
                    dm.AnnotationType.label
                ]
                skeleton_label_id = next(
                    i for i, label in enumerate(merged_label_cat) if not label.parent
                )
                point_label_id = next(i for i, label in enumerate(merged_label_cat) if label.parent)

                for sample in gt_dataset:
                    annotations = [
                        dm.Skeleton(
                            elements=[
                                # Put a point in the center of each GT bbox
                                # Not ideal, but it's the target for now
                                dm.Points(
                                    [bbox.x + bbox.w / 2, bbox.y + bbox.h / 2],
                                    label=point_label_id,
                                    attributes=bbox.attributes,
                                )
                            ],
                            label=skeleton_label_id,
                        )
                        for bbox in sample.annotations
                        if isinstance(bbox, dm.Bbox)
                    ]
                    merged_dataset.put(sample.wrap(annotations=annotations))
            case TaskTypes.image_label_binary.value:
                merged_dataset.update(gt_dataset)
            case TaskTypes.image_boxes_from_points:
                merged_dataset.update(gt_dataset)
            case TaskTypes.image_skeletons_from_boxes:
                # The original behavior is broken for skeletons
                gt_dataset = dm.Dataset(gt_dataset)
                gt_dataset = gt_dataset.transform(
                    ProjectLabels, dst_labels=merged_dataset.categories()[dm.AnnotationType.label]
                )
                merged_dataset.update(gt_dataset)
            case _:
                assert False, f"Unknown task type {manifest.annotation.type}"

    def validate(self) -> _ValidationResult:
        with TemporaryDirectory() as tempdir:
            self._temp_dir = Path(tempdir)

            self._parse_gt()
            self._validate_jobs()
            self._prepare_merged_dataset()

        return _ValidationResult(
            job_results=self._require_field(self._job_results),
            rejected_jobs=self._require_field(self._rejected_jobs),
            updated_merged_dataset=self._require_field(self._updated_merged_dataset_archive),
            updated_gt_stats=self._require_field(self._updated_gt_stats),
        )


class _TaskValidatorWithPerJobGt(_TaskValidator):
    def _make_gt_dataset_for_job(self, job_id: int, job_dataset: dm.Dataset) -> dm.Dataset:
        raise NotImplementedError

    def _get_gt_weights(self, *, job_cvat_id: int, job_gt_dataset: dm.Dataset) -> Dict[str, float]:
        weights = {}

        ban_threshold = Config.validation.gt_ban_threshold
        if not ban_threshold:
            return weights

        for gt_key, attempts in self._initial_gt_attempts.items():
            sample_id = self._gt_key_to_sample_id(
                gt_key, job_cvat_id=job_cvat_id, job_gt_dataset=job_gt_dataset
            )
            if not sample_id:
                continue

            weights[sample_id] = self._get_gt_weight(attempts)

        return weights

    def _gt_key_to_sample_id(
        self, gt_key: str, *, job_cvat_id: int, job_gt_dataset: dm.Dataset
    ) -> Optional[str]:
        return gt_key

    def _update_gt_stats(
        self,
        updated_gt_stats: _UpdatedFailedGtStats,
        *,
        job_cvat_id: int,
        job_gt_dataset: dm.Dataset,
        failed_gts: set[str],
    ):
        for gt_sample in job_gt_dataset:
            updated_gt_stats.setdefault(gt_sample.id, _UpdatedFailedGtInfo()).occurrences += 1

        for sample_id in failed_gts:
            updated_gt_stats[sample_id].failed_jobs.add(job_cvat_id)

        return updated_gt_stats

    def _validate_jobs(self):
        tempdir = self._require_field(self._temp_dir)
        manifest = self._require_field(self.manifest)
        job_annotations = self._require_field(self._job_annotations)

        job_results: _JobResults = {}
        rejected_jobs: _RejectedJobs = {}
        updated_gt_stats: _UpdatedFailedGtStats = {}

        for job_cvat_id, job_annotations_file in job_annotations.items():
            job_dataset_path = tempdir / str(job_cvat_id)
            extract_zip_archive(job_annotations_file, job_dataset_path)

            job_dataset = self._load_job_dataset(job_cvat_id, job_dataset_path)
            job_gt_dataset = self._make_gt_dataset_for_job(job_cvat_id, job_dataset)

            comparator = DATASET_COMPARATOR_TYPE_MAP[manifest.annotation.type](
                min_similarity_threshold=manifest.validation.min_quality,
                gt_weights=self._get_gt_weights(
                    job_cvat_id=job_cvat_id, job_gt_dataset=job_gt_dataset
                ),
            )

            try:
                job_mean_accuracy = comparator.compare(job_gt_dataset, job_dataset)
            except TooFewGtError as e:
                job_results[job_cvat_id] = self.UNKNOWN_QUALITY
                rejected_jobs[job_cvat_id] = e
                continue

            job_results[job_cvat_id] = job_mean_accuracy

            updated_gt_stats = self._update_gt_stats(
                updated_gt_stats,
                job_cvat_id=job_cvat_id,
                job_gt_dataset=job_gt_dataset,
                failed_gts=comparator.failed_gts,
            )

            if job_mean_accuracy < manifest.validation.min_quality:
                rejected_jobs[job_cvat_id] = LowAccuracyError()

        self._updated_gt_stats = updated_gt_stats
        self._job_results = job_results
        self._rejected_jobs = rejected_jobs


class _BoxesFromPointsValidator(_TaskValidatorWithPerJobGt):
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

        self._point_key_to_bbox_key = {v: k for k, v in boxes_to_points_mapping.items()}
        self._roi_info_by_id = {roi_info.point_id: roi_info for roi_info in roi_infos}
        self._roi_name_to_roi_info: Dict[str, boxes_from_points_task.RoiInfo] = {
            os.path.splitext(roi_filename)[0]: self._roi_info_by_id[roi_id]
            for roi_id, roi_filename in roi_filenames.items()
        }

        self._point_offset_by_roi_id = {}
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
            self._point_offset_by_roi_id[roi_info.point_id] = (offset_x, offset_y)

    def _parse_gt(self):
        pass  # handled by _download_task_meta()

    def _download_task_meta(self):
        layout = boxes_from_points_task.TaskMetaLayout()
        serializer = boxes_from_points_task.TaskMetaSerializer()

        oracle_data_bucket = BucketAccessInfo.parse_obj(Config.exchange_oracle_storage_config)
        storage_client = make_cloud_client(oracle_data_bucket)

        boxes_to_points_mapping = serializer.parse_bbox_point_mapping(
            storage_client.download_file(
                compose_data_bucket_filename(
                    self.escrow_address, self.chain_id, layout.BBOX_POINT_MAPPING_FILENAME
                ),
            )
        )

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

        gt_dataset = serializer.parse_gt_annotations(
            storage_client.download_file(
                compose_data_bucket_filename(
                    self.escrow_address, self.chain_id, layout.GT_FILENAME
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

        return boxes_to_points_mapping, roi_filenames, rois, gt_dataset, points_dataset

    def _make_gt_dataset_for_job(self, job_id: int, job_dataset: dm.Dataset) -> dm.Dataset:
        job_gt_dataset = dm.Dataset(categories=self._gt_dataset.categories(), media_type=dm.Image)

        for job_sample in job_dataset:
            roi_info = self._roi_name_to_roi_info[os.path.basename(job_sample.id)]

            point_bbox_key = self._point_key_to_bbox_key.get(roi_info.point_id, None)
            if point_bbox_key is None:
                continue  # roi is not from GT set

            bbox_sample = self.bbox_key_to_sample[point_bbox_key]

            bbox = next(bbox for bbox in bbox_sample.annotations if bbox.id == point_bbox_key)
            roi_shift_x, roi_shift_y = self._point_offset_by_roi_id[roi_info.point_id]

            bbox_in_roi_coords = shift_ann(
                bbox,
                offset_x=-roi_shift_x,
                offset_y=-roi_shift_y,
                img_w=roi_info.roi_w,
                img_h=roi_info.roi_h,
            )

            job_gt_dataset.put(job_sample.wrap(annotations=[bbox_in_roi_coords]))

        return job_gt_dataset

    def _prepare_merged_dataset(self):
        super()._parse_gt()  # We need to download the original GT dataset
        return super()._prepare_merged_dataset()


class _SkeletonsFromBoxesValidator(_TaskValidatorWithPerJobGt):
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

        self._boxes_dataset = boxes_dataset
        self._original_key_to_sample = {sample.attributes["id"]: sample for sample in boxes_dataset}

        self._job_label_mapping = job_label_mapping

        self._gt_dataset = gt_dataset

        self._bbox_key_to_sample = {
            bbox.id: sample
            for sample in boxes_dataset
            for bbox in sample.annotations
            if isinstance(bbox, dm.Bbox)
        }

        self._skeleton_key_to_sample = {
            skeleton.id: sample
            for sample in gt_dataset
            for skeleton in sample.annotations
            if isinstance(skeleton, dm.Skeleton)
        }

        self._bbox_key_to_skeleton_key = {v: k for k, v in skeletons_to_boxes_mapping.items()}
        self._roi_info_by_id = {roi_info.bbox_id: roi_info for roi_info in roi_infos}
        self._roi_name_to_roi_info: Dict[str, skeletons_from_boxes_task.RoiInfo] = {
            os.path.splitext(roi_filename)[0]: self._roi_info_by_id[roi_id]
            for roi_id, roi_filename in roi_filenames.items()
        }

        self._bbox_offset_by_roi_id = {}
        "Offset from old to new coords, (dx, dy)"

        for roi_info in roi_infos:
            bbox_sample = self._bbox_key_to_sample[roi_info.bbox_id]

            old_bbox = next(
                bbox
                for bbox in bbox_sample.annotations
                if bbox.id == roi_info.bbox_id
                if isinstance(bbox, dm.Bbox)
            )
            offset_x = roi_info.bbox_x - old_bbox.x
            offset_y = roi_info.bbox_y - old_bbox.y

            self._bbox_offset_by_roi_id[roi_info.bbox_id] = (offset_x, offset_y)

    def _parse_gt(self):
        pass  # handled by _download_task_meta()

    def _download_task_meta(self):
        layout = skeletons_from_boxes_task.TaskMetaLayout()
        serializer = skeletons_from_boxes_task.TaskMetaSerializer()

        oracle_data_bucket = BucketAccessInfo.parse_obj(Config.exchange_oracle_storage_config)
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

        gt_dataset = serializer.parse_gt_annotations(
            storage_client.download_file(
                compose_data_bucket_filename(
                    self.escrow_address, self.chain_id, layout.GT_FILENAME
                ),
            )
        )

        skeletons_to_boxes_mapping = serializer.parse_skeleton_bbox_mapping(
            storage_client.download_file(
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

    def _load_job_dataset(self, job_id: int, job_dataset_path: Path) -> dm.Dataset:
        job_dataset = super()._load_job_dataset(job_id=job_id, job_dataset_path=job_dataset_path)

        cat = job_dataset.categories()
        updated_dataset = dm.Dataset(categories=cat, media_type=job_dataset.media_type())

        job_label_cat: dm.LabelCategories = cat[dm.AnnotationType.label]
        assert len(job_label_cat) == 2
        job_skeleton_label_id = next(i for i, c in enumerate(job_label_cat) if not c.parent)
        job_point_label_id = next(i for i, c in enumerate(job_label_cat) if c.parent)

        for job_sample in job_dataset:
            updated_annotations = job_sample.annotations.copy()

            if not job_sample.annotations:
                skeleton = dm.Skeleton(
                    label=job_skeleton_label_id,
                    elements=[
                        dm.Points(
                            [0, 0],
                            visibility=[dm.Points.Visibility.absent],
                            label=job_point_label_id,
                        )
                    ],
                )

                roi_info = self._roi_name_to_roi_info[os.path.basename(job_sample.id)]
                bbox_sample = self._bbox_key_to_sample[roi_info.bbox_id]
                bbox = next(
                    bbox
                    for bbox in bbox_sample.annotations
                    if bbox.id == roi_info.bbox_id
                    if isinstance(bbox, dm.Bbox)
                )

                roi_shift_x, roi_shift_y = self._bbox_offset_by_roi_id[roi_info.bbox_id]
                converted_bbox = shift_ann(
                    bbox,
                    offset_x=roi_shift_x,
                    offset_y=roi_shift_y,
                    img_w=roi_info.roi_w,
                    img_h=roi_info.roi_h,
                )

                skeleton.group = 1
                converted_bbox.group = skeleton.group

                updated_annotations = [skeleton, converted_bbox]

            updated_dataset.put(job_sample.wrap(annotations=updated_annotations))

        return updated_dataset

    def _make_gt_dataset_for_job(self, job_id: int, job_dataset: dm.Dataset) -> dm.Dataset:
        job_label_cat: dm.LabelCategories = job_dataset.categories()[dm.AnnotationType.label]
        assert len(job_label_cat) == 2
        job_skeleton_label_id, job_skeleton_label = next(
            (i, c) for i, c in enumerate(job_label_cat) if not c.parent
        )
        job_point_label_id, job_point_label = next(
            (i, c) for i, c in enumerate(job_label_cat) if c.parent
        )

        gt_label_cat = self._gt_dataset.categories()[dm.AnnotationType.label]
        gt_point_label_id = gt_label_cat.find(job_point_label.name, parent=job_skeleton_label.name)[
            0
        ]

        job_gt_dataset = dm.Dataset(categories=job_dataset.categories(), media_type=dm.Image)
        for job_sample in job_dataset:
            roi_info = self._roi_name_to_roi_info[os.path.basename(job_sample.id)]

            gt_skeleton_key = self._bbox_key_to_skeleton_key.get(roi_info.bbox_id, None)
            if gt_skeleton_key is None:
                continue  # roi is not from GT set

            bbox_sample = self._bbox_key_to_sample[roi_info.bbox_id]
            bbox = next(
                bbox
                for bbox in bbox_sample.annotations
                if bbox.id == roi_info.bbox_id
                if isinstance(bbox, dm.Bbox)
            )

            gt_sample = self._skeleton_key_to_sample[gt_skeleton_key]
            gt_skeleton = next(
                skeleton
                for skeleton in gt_sample.annotations
                if skeleton.id == gt_skeleton_key
                if isinstance(skeleton, dm.Skeleton)
            )

            roi_shift_x, roi_shift_y = self._bbox_offset_by_roi_id[roi_info.bbox_id]
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

    @dataclass
    class _GtKey:
        sample_id: str
        skeleton_id: int
        point_id: int

    _GT_KEY_SEPARATOR = ":"

    def _parse_gt_key(self, raw_gt_key: str) -> _GtKey:
        # Assume "sample_id:skeleton_id:point_id"
        sample_id, skeleton_id, point_id = raw_gt_key.rsplit(self._GT_KEY_SEPARATOR, maxsplit=2)

        return self._GtKey(
            sample_id=sample_id, skeleton_id=int(skeleton_id), point_id=int(point_id)
        )

    def _serialize_gt_key(self, parsed_gt_key: _GtKey) -> str:
        # Assume "sample_id:skeleton_id:point_id"
        return self._GT_KEY_SEPARATOR.join(
            [parsed_gt_key.sample_id, str(parsed_gt_key.skeleton_id), str(parsed_gt_key.point_id)]
        )

    class _LabelId(NamedTuple):
        skeleton_id: int
        point_id: int

    def _get_gt_dataset_label_id(self, job_gt_dataset: dm.Dataset) -> _LabelId:
        label_cat: dm.LabelCategories = job_gt_dataset.categories()[dm.AnnotationType.label]
        assert len(label_cat) == 2
        job_skeleton_label = next(l for l in label_cat if not l.parent)
        job_point_label = next(l for l in label_cat if l.parent)

        return self._LabelId(
            *next(
                (skeleton_id, point_id)
                for skeleton_id, skeleton_label in enumerate(self.manifest.annotation.labels)
                for point_id, point_name in enumerate(skeleton_label.nodes)
                if skeleton_label.name == job_skeleton_label.name
                if point_name == job_point_label.name
            )
        )

    def _gt_key_to_sample_id(
        self, gt_key: str, *, job_cvat_id: int, job_gt_dataset: dm.Dataset
    ) -> Optional[str]:
        parsed_gt_key = self._parse_gt_key(gt_key)
        job_label_id = self._get_gt_dataset_label_id(job_gt_dataset)
        if (parsed_gt_key.skeleton_id, parsed_gt_key.point_id) != job_label_id:
            return None

        return parsed_gt_key.sample_id

    def _update_gt_stats(
        self,
        updated_gt_stats: _UpdatedFailedGtStats,
        *,
        job_cvat_id: int,
        job_gt_dataset: dm.Dataset,
        failed_gts: set[str],
    ):
        job_label_id = self._get_gt_dataset_label_id(job_gt_dataset)

        for gt_sample in job_gt_dataset:
            raw_gt_key = self._serialize_gt_key(
                self._GtKey(
                    sample_id=gt_sample.id,
                    skeleton_id=job_label_id.skeleton_id,
                    point_id=job_label_id.point_id,
                )
            )
            updated_gt_stats.setdefault(raw_gt_key, _UpdatedFailedGtInfo()).occurrences += 1

        for gt_sample_id in failed_gts:
            raw_gt_key = self._serialize_gt_key(
                self._GtKey(
                    sample_id=gt_sample_id,
                    skeleton_id=job_label_id.skeleton_id,
                    point_id=job_label_id.point_id,
                )
            )
            updated_gt_stats[raw_gt_key].failed_jobs.add(job_cvat_id)

        return updated_gt_stats

    def _prepare_merged_dataset(self):
        super()._parse_gt()  # We need to download the original GT dataset
        return super()._prepare_merged_dataset()


def _compute_gt_stats_update(
    initial_gt_stats: _FailedGtAttempts, validation_gt_stats: _UpdatedFailedGtStats
) -> _FailedGtAttempts:
    updated_gt_stats = initial_gt_stats.copy()

    for gt_key, gt_info in validation_gt_stats.items():
        if gt_info.occurrences * Config.validation.gt_failure_threshold < len(gt_info.failed_jobs):
            updated_gt_stats[gt_key] = updated_gt_stats.get(gt_key, 0) + 1

    return updated_gt_stats


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
    # actually validate jobs

    task_type = manifest.annotation.type
    if task_type in [TaskTypes.image_label_binary, TaskTypes.image_boxes, TaskTypes.image_points]:
        validator_type = _TaskValidator
    elif task_type == TaskTypes.image_boxes_from_points:
        validator_type = _BoxesFromPointsValidator
    elif task_type == TaskTypes.image_skeletons_from_boxes:
        validator_type = _SkeletonsFromBoxesValidator
    else:
        raise Exception(f"Unknown task type {task_type}")

    task = db_service.get_task_by_escrow_address(
        session,
        escrow_address,
        for_update=ForUpdateParams(
            nowait=True
        ),  # should not happen, but waiting should not block processing
    )
    if not task:
        task_id = db_service.create_task(session, escrow_address=escrow_address, chain_id=chain_id)
        task = db_service.get_task_by_id(session, task_id, for_update=True)

    if logger.isEnabledFor(logging.DEBUG):
        logger.debug("process_intermediate_results for escrow %s", escrow_address)
        logger.debug("Task id %s, %s", getattr(task, "id", None), getattr(task, "__dict__", None))

    initial_gt_stats = {
        gt_image_stat.gt_key: gt_image_stat.failed_attempts
        for gt_image_stat in db_service.get_task_gt_stats(session, task.id)
    }

    validator = validator_type(
        escrow_address=escrow_address,
        chain_id=chain_id,
        manifest=manifest,
        job_annotations=job_annotations,
        merged_annotations=merged_annotations,
        gt_stats=initial_gt_stats,
    )

    validation_result = validator.validate()
    job_results = validation_result.job_results
    rejected_jobs = validation_result.rejected_jobs
    updated_merged_dataset_archive = validation_result.updated_merged_dataset

    if logger.isEnabledFor(logging.DEBUG):
        logger.debug("Validation results %s", validation_result)
        logger.debug(
            "Task validation results for escrow_address=%s: %s",
            escrow_address,
            ", ".join(f"{k}: {v:.2f}" for k, v in job_results.items()),
        )

    if validation_result.updated_gt_stats:
        updated_gt_stats = _compute_gt_stats_update(
            initial_gt_stats, validation_result.updated_gt_stats
        )

        if logger.isEnabledFor(logging.DEBUG):
            logger.debug("Updating GT stats: %s", updated_gt_stats)

        db_service.update_gt_stats(session, task.id, updated_gt_stats)

    job_final_result_ids: Dict[int, str] = {}
    for job_meta in meta.jobs:
        job = db_service.get_job_by_cvat_id(session, job_meta.job_id)
        if not job:
            job_id = db_service.create_job(session, task_id=task.id, job_cvat_id=job_meta.job_id)
            job = db_service.get_job_by_id(session, job_id)

        assignment_validation_result = db_service.get_validation_result_by_assignment_id(
            session, job_meta.assignment_id
        )
        if not assignment_validation_result:
            assignment_validation_result_id = db_service.create_validation_result(
                session,
                job_id=job.id,
                annotator_wallet_address=job_meta.annotator_wallet_address,
                annotation_quality=job_results[job_meta.job_id],
                assignment_id=job_meta.assignment_id,
            )
        else:
            assignment_validation_result_id = assignment_validation_result.id

        job_final_result_ids[job.id] = assignment_validation_result_id

    task_jobs = task.jobs

    should_complete = False

    if 0 < Config.validation.max_escrow_iterations:
        escrow_iteration = task.iteration
        if escrow_iteration and Config.validation.max_escrow_iterations <= escrow_iteration:
            logger.info(
                "Validation for escrow_address={}: too many iterations, stopping annotation".format(
                    escrow_address
                )
            )
            should_complete = True

    db_service.update_escrow_iteration(session, escrow_address, chain_id, task.iteration + 1)

    if not should_complete:
        total_jobs = len(task_jobs)
        unverifiable_jobs_count = len(
            [v for v in rejected_jobs.values() if isinstance(v, TooFewGtError)]
        )
        if (
            total_jobs * Config.validation.unverifiable_assignments_threshold
            < unverifiable_jobs_count
        ):
            logger.info(
                "Validation for escrow_address={}: "
                "too many assignments have insufficient GT for validation ({} of {} ({:.2f}%)), "
                "stopping annotation".format(
                    escrow_address,
                    unverifiable_jobs_count,
                    total_jobs,
                    unverifiable_jobs_count / total_jobs * 100,
                )
            )
            should_complete = True
        elif len(rejected_jobs) == unverifiable_jobs_count:
            if unverifiable_jobs_count:
                logger.info(
                    "Validation for escrow_address={}: "
                    "only unverifiable assignments left ({}), stopping annotation".format(
                        escrow_address,
                        unverifiable_jobs_count,
                    )
                )

            should_complete = True

    if not should_complete:
        return ValidationFailure(rejected_jobs)

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
        average_quality=np.mean(
            list(v for v in job_results.values() if v != _TaskValidator.UNKNOWN_QUALITY and v >= 0)
            or [0]
        ),
    )


def parse_annotation_metafile(metafile: io.RawIOBase) -> AnnotationMeta:
    return AnnotationMeta.parse_raw(metafile.read())


def serialize_validation_meta(validation_meta: ValidationMeta) -> bytes:
    return validation_meta.json().encode()
