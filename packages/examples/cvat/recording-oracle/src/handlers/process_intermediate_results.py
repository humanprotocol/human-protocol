from __future__ import annotations

import io
import logging
import os
from dataclasses import dataclass, field
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import TYPE_CHECKING, TypeVar

import datumaro as dm
import numpy as np

import src.core.tasks.simple as simple_task
import src.cvat.api_calls as cvat_api
import src.services.validation as db_service
from src.core.annotation_meta import AnnotationMeta
from src.core.config import Config
from src.core.storage import compose_data_bucket_filename
from src.core.types import TaskTypes
from src.core.validation_errors import DatasetValidationError, LowAccuracyError, TooFewGtError
from src.core.validation_meta import JobMeta, ResultMeta, ValidationMeta
from src.core.validation_results import ValidationFailure, ValidationSuccess
from src.db.utils import ForUpdateParams
from src.services.cloud import make_client as make_cloud_client
from src.services.cloud.utils import BucketAccessInfo
from src.utils.annotations import ProjectLabels
from src.utils.zip_archive import extract_zip_archive, write_dir_to_zip_archive

if TYPE_CHECKING:
    from sqlalchemy.orm import Session

    from src.core.manifest import TaskManifest

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


_JobResults = dict[int, float]

_RejectedJobs = dict[int, DatasetValidationError]

_GtStats = dict[tuple[int, int], dict[str, int]]


@dataclass
class _UpdatedFailedGtInfo:
    failed_jobs: set[int] = field(default_factory=set)
    occurrences: int = 0


_UpdatedFailedGtStats = dict[str, _UpdatedFailedGtInfo]

_ValidationFrameIdToJobs = dict[int, list[int]]

_TaskIdToValidationLayout = dict[int, dict]
_TaskIdToHoneypotsMapping = dict[int, dict]


@dataclass
class _ValidationResult:
    job_results: _JobResults
    rejected_jobs: _RejectedJobs
    updated_merged_dataset: io.BytesIO
    updated_gt_stats: _UpdatedFailedGtStats
    # val_frame_id_to_jobs: _ValidationFrameIdToJobs
    task_id_to_val_layout: _TaskIdToValidationLayout
    task_id_to_honeypots_mapping: _TaskIdToHoneypotsMapping


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
        merged_annotations: io.IOBase,
        meta: AnnotationMeta,
        gt_stats: _GtStats | None = None,
    ) -> None:
        self.escrow_address = escrow_address
        self.chain_id = chain_id
        self.manifest = manifest

        self._initial_gt_stats: _GtStats = gt_stats or {}
        self._merged_annotations: io.IOBase = merged_annotations

        self._updated_merged_dataset_archive: io.IOBase | None = None
        self._job_results: _JobResults | None = None
        self._rejected_jobs: _RejectedJobs | None = None

        self._temp_dir: Path | None = None
        self._gt_dataset: dm.Dataset | None = None
        self._meta: AnnotationMeta = meta

    def _require_field(self, field: T | None) -> T:
        assert field is not None
        return field

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

    # remove
    def _load_job_dataset(self, job_id: int, job_dataset_path: Path) -> dm.Dataset:  # noqa: ARG002
        manifest = self._require_field(self.manifest)

        return dm.Dataset.import_from(
            os.fspath(job_dataset_path),
            format=DM_DATASET_FORMAT_MAPPING[manifest.annotation.type],
        )

    def _validate_jobs(self):
        manifest = self._require_field(self.manifest)
        meta = self._require_field(self._meta)

        job_results: _JobResults = {}
        rejected_jobs: _RejectedJobs = {}
        self._updated_gt_stats = {}

        cvat_task_ids = {job_meta.task_id for job_meta in meta.jobs}
        cvat_job_ids = {job_meta.job_id for job_meta in meta.jobs}
        job_id_to_task_id = {job_meta.job_id: job_meta.task_id for job_meta in meta.jobs}

        task_id_to_quality_report: dict[int, dict] = {}
        task_id_to_quality_report_data: dict[int, dict] = {}
        task_id_to_val_layout: dict[int, dict] = {}
        task_id_to_honeypots_mapping: dict[int, dict] = {}

        min_quality = manifest.validation.min_quality

        for cvat_task_id in cvat_task_ids:
            task_quality_report = cvat_api.get_task_quality_report(cvat_task_id)
            task_id_to_quality_report[cvat_task_id] = task_quality_report

            task_quality_report_data = cvat_api.get_quality_report_data(task_quality_report.id)
            task_id_to_quality_report_data[cvat_task_id] = task_quality_report_data

            task_val_layout = cvat_api.get_task_validation_layout(cvat_task_id)
            honeypot_frame_to_real = {
                f: task_val_layout.honeypot_real_frames[idx]
                for idx, f in enumerate(task_val_layout.honeypot_frames)
            }
            task_id_to_val_layout[cvat_task_id] = task_val_layout
            task_id_to_honeypots_mapping[cvat_task_id] = honeypot_frame_to_real

            # define honeypots with low quality
            frame_results = task_quality_report_data.frame_results
            for honeypot_frame_id, result in frame_results.items():
                honeypot_frame_id = int(honeypot_frame_id)

                if result.annotations.accuracy < min_quality:
                    val_frame_id = task_id_to_honeypots_mapping[cvat_task_id][honeypot_frame_id]
                    self._updated_gt_stats.setdefault((cvat_task_id, val_frame_id), 0)
                    self._updated_gt_stats[(cvat_task_id, val_frame_id)] += 1

        job_id_to_quality_report = cvat_api.get_jobs_quality_reports(task_quality_report.id)

        for cvat_job_id in cvat_job_ids:
            cvat_task_id = job_id_to_task_id[cvat_job_id]

            job_quality_report = job_id_to_quality_report[cvat_job_id]

            accuracy = job_quality_report.summary.accuracy
            if isinstance(accuracy, int):
                assert accuracy == 0
                job_results[cvat_job_id] = self.UNKNOWN_QUALITY
                rejected_jobs[cvat_job_id] = TooFewGtError
                continue

            job_results[cvat_job_id] = accuracy

            min_quality = manifest.validation.min_quality

            if accuracy < min_quality:
                rejected_jobs[cvat_job_id] = LowAccuracyError()

        self._job_results = job_results
        self._rejected_jobs = rejected_jobs
        self._task_id_to_val_layout = task_id_to_val_layout
        self._task_id_to_honeypots_mapping = task_id_to_honeypots_mapping

    def _restore_original_image_paths(self, merged_dataset: dm.Dataset) -> dm.Dataset:
        class RemoveCommonPrefix(dm.ItemTransform):
            def __init__(self, extractor: dm.IExtractor, *, prefix: str) -> None:
                super().__init__(extractor)
                self._prefix = prefix

            def transform_item(self, item: dm.DatasetItem) -> dm.DatasetItem:
                if item.id.startswith(self._prefix):
                    item = item.wrap(id=item.id[len(self._prefix) :])
                return item

        prefix = BucketAccessInfo.parse_obj(self.manifest.data.data_url).path.lstrip("/\\") + "/"
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
    ) -> None:
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
                raise AssertionError(f"Unknown task type {manifest.annotation.type}")

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
            # val_frame_id_to_jobs=self._require_field(self._val_frame_id_to_jobs),
            task_id_to_val_layout=self._require_field(self._task_id_to_val_layout),
            task_id_to_honeypots_mapping=self._require_field(self._task_id_to_honeypots_mapping),
        )


def process_intermediate_results(  # noqa: PLR0912
    session: Session,
    *,
    escrow_address: str,
    chain_id: int,
    meta: AnnotationMeta,
    merged_annotations: io.RawIOBase,
    manifest: TaskManifest,
    logger: logging.Logger,
) -> ValidationSuccess | ValidationFailure:
    task = db_service.get_task_by_escrow_address(
        session,
        escrow_address,
        for_update=ForUpdateParams(
            nowait=True
        ),  # should not happen, but waiting should not block processing
    )
    if not task:
        # Recording Oracle task represents all CVAT tasks related with the escrow
        task_id = db_service.create_task(session, escrow_address=escrow_address, chain_id=chain_id)
        task = db_service.get_task_by_id(session, task_id, for_update=True)

    if logger.isEnabledFor(logging.DEBUG):
        logger.debug("process_intermediate_results for escrow %s", escrow_address)
        logger.debug("Task id %s, %s", getattr(task, "id", None), getattr(task, "__dict__", None))

    initial_gt_stats = {
        (gt_image_stat.cvat_task_id, gt_image_stat.gt_frame_id): gt_image_stat.failed_attempts
        for gt_image_stat in db_service.get_task_gt_stats(session, task.id)
    }

    validator = _TaskValidator(
        escrow_address=escrow_address,
        chain_id=chain_id,
        manifest=manifest,
        merged_annotations=merged_annotations,
        meta=meta,
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

    updated_gt_stats = validation_result.updated_gt_stats
    if updated_gt_stats and updated_gt_stats != initial_gt_stats:
        cvat_task_id_to_failed_val_frames = {}  # cvat_task_id: [val_frame_id, ...]
        for (cvat_task_id, val_frame_id), value in updated_gt_stats.items():
            if value >= Config.validation.gt_ban_threshold:
                cvat_task_id_to_failed_val_frames.setdefault(cvat_task_id, []).append(val_frame_id)

        for cvat_task_id, val_frame_ids in cvat_task_id_to_failed_val_frames.items():
            task_validation_layout = validation_result.task_id_to_val_layout[cvat_task_id]
            intersection = set(val_frame_ids) & set(task_validation_layout.disabled_frames)

            if intersection:
                logger.error(f"Unexpected case: frames {intersection} were disabled earlier")

            upd_disabled_frames = task_validation_layout.disabled_frames + val_frame_ids

            shuffle_honeypots = True
            if set(upd_disabled_frames) == set(task_validation_layout.validation_frames):
                logger.error("All validation frames were banned. Honeypots will not be shuffled")
                shuffle_honeypots = False

            cvat_api.update_task_validation_layout(
                cvat_task_id,
                disabled_frames=upd_disabled_frames,
                shuffle_honeypots=shuffle_honeypots,
            )

        if logger.isEnabledFor(logging.DEBUG):
            logger.debug("Updating GT stats: %s", updated_gt_stats)

        db_service.update_gt_stats(session, task.id, updated_gt_stats)

    job_final_result_ids: dict[int, str] = {}
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

    if Config.validation.max_escrow_iterations > 0:
        escrow_iteration = task.iteration
        if escrow_iteration and Config.validation.max_escrow_iterations <= escrow_iteration:
            logger.info(
                f"Validation for escrow_address={escrow_address}:"
                f" too many iterations, stopping annotation"
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
                f"Validation for escrow_address={escrow_address}: "
                f"too many assignments have insufficient GT for validation "
                f"({unverifiable_jobs_count} of {total_jobs} "
                f"({unverifiable_jobs_count / total_jobs * 100:.2f}%)), stopping annotation"
            )
            should_complete = True
        elif len(rejected_jobs) == unverifiable_jobs_count:
            if unverifiable_jobs_count:
                logger.info(
                    f"Validation for escrow_address={escrow_address}: "
                    f"only unverifiable assignments left ({unverifiable_jobs_count}),"
                    f" stopping annotation"
                )

            should_complete = True

    if not should_complete:
        return ValidationFailure(job_results=job_results, rejected_jobs=rejected_jobs)

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
        job_results=job_results,
        validation_meta=validation_meta,
        resulting_annotations=updated_merged_dataset_archive.getvalue(),
        average_quality=np.mean(
            [v for v in job_results.values() if v != _TaskValidator.UNKNOWN_QUALITY and v >= 0]
            or [0]
        ),
    )


def parse_annotation_metafile(metafile: io.RawIOBase) -> AnnotationMeta:
    return AnnotationMeta.model_validate_json(metafile.read())


def serialize_validation_meta(validation_meta: ValidationMeta) -> bytes:
    return validation_meta.model_dump_json().encode()
