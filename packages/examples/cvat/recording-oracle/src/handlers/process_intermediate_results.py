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


@dataclass
class _ValidationResult:
    job_results: _JobResults
    rejected_jobs: _RejectedJobs
    updated_merged_dataset: io.BytesIO
    updated_gt_stats: _UpdatedFailedGtStats
    val_frame_id_to_jobs: _ValidationFrameIdToJobs


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
        job_annotations: dict[int, io.IOBase],
        merged_annotations: io.IOBase,
        meta: AnnotationMeta,
        gt_stats: _GtStats | None = None,
    ) -> None:
        self.escrow_address = escrow_address
        self.chain_id = chain_id
        self.manifest = manifest

        self._initial_gt_stats: _GtStats = gt_stats or {}
        self._job_annotations: dict[int, io.IOBase] = job_annotations
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

    def _load_job_dataset(self, job_id: int, job_dataset_path: Path) -> dm.Dataset:  # noqa: ARG002
        manifest = self._require_field(self.manifest)

        return dm.Dataset.import_from(
            os.fspath(job_dataset_path),
            format=DM_DATASET_FORMAT_MAPPING[manifest.annotation.type],
        )

    def _validate_jobs(self):
        tempdir = self._require_field(self._temp_dir)
        manifest = self._require_field(self.manifest)
        job_annotations = self._require_field(self._job_annotations)

        job_results: _JobResults = {}
        rejected_jobs: _RejectedJobs = {}
        self._updated_gt_stats = {}

        cvat_task_ids = {job_meta.task_id for job_meta in self._meta.jobs}
        job_id_to_task_id = {job_meta.job_id: job_meta.task_id for job_meta in self._meta.jobs}

        task_id_to_quality_report: dict[int, dict] = {}
        task_id_to_val_layout: dict[int, dict] = {}
        task_id_to_honeypots_mapping: dict[int, dict] = {}
        task_id_to_failed_gt: dict[int, list[int]] = {}

        val_frame_id_to_jobs: dict[int, list[int]] = {}

        for cvat_task_id in cvat_task_ids:
            task_quality_report = cvat_api.get_task_quality_report(cvat_task_id)
            task_id_to_quality_report[cvat_task_id] = task_quality_report

            if task_quality_report.summary.error_count:
                task_quality_report_data = cvat_api.get_quality_report_data(task_quality_report.id)

                task_val_layout = cvat_api.get_task_validation_layout(cvat_task_id)
                honeypot_frame_to_real = {
                    f: task_val_layout.honeypot_real_frames[idx]
                    for idx, f in enumerate(task_val_layout.honeypot_frames)
                }
                task_id_to_val_layout[cvat_task_id] = task_val_layout
                task_id_to_honeypots_mapping[cvat_task_id] = honeypot_frame_to_real

                for frame_id, result in task_quality_report_data["frame_results"].items():
                    honeypot_frame_id = int(frame_id)
                    val_frame_id = honeypot_frame_to_real[honeypot_frame_id]

                    errors = bool(
                        [
                            conflict
                            for conflict in result["conflicts"]
                            if conflict["severity"] == "error"
                        ]
                    )

                    if errors:
                        task_id_to_failed_gt.setdefault(cvat_task_id, []).append(val_frame_id)
                        self._updated_gt_stats.setdefault(
                            (cvat_task_id, val_frame_id),
                            {
                                "failed_attempts": 0,
                            },
                        )
                        self._updated_gt_stats[(cvat_task_id, val_frame_id)]["failed_attempts"] += 1

        job_id_to_quality_report = cvat_api.get_jobs_quality_reports(task_quality_report.id)

        for cvat_job_id, job_annotations_file in job_annotations.items():
            cvat_task_id = job_id_to_task_id[cvat_job_id]

            job_dataset_path = tempdir / str(cvat_job_id)
            extract_zip_archive(job_annotations_file, job_dataset_path)

            job_quality_report = job_id_to_quality_report[cvat_job_id]

            accuracy = job_quality_report.summary.accuracy
            if isinstance(accuracy, int):
                assert accuracy == 0
                job_results[cvat_job_id] = self.UNKNOWN_QUALITY
                rejected_jobs[cvat_job_id] = TooFewGtError
                continue

            job_results[cvat_job_id] = accuracy

            if accuracy < manifest.validation.min_quality:
                rejected_jobs[cvat_job_id] = LowAccuracyError()

                job_validation_layout = cvat_api.get_job_validation_layout(cvat_job_id)
                for val_frame_id in job_validation_layout.honeypot_real_frames:
                    val_frame_id_to_jobs.setdefault(val_frame_id, []).append(cvat_job_id)

        self._job_results = job_results
        self._rejected_jobs = rejected_jobs
        self._val_frame_id_to_jobs = val_frame_id_to_jobs

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
            val_frame_id_to_jobs=self._require_field(self._val_frame_id_to_jobs),
        )


def process_intermediate_results(  # noqa: PLR0912
    session: Session,
    *,
    escrow_address: str,
    chain_id: int,
    meta: AnnotationMeta,
    job_annotations: dict[int, io.RawIOBase],
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
        task_id = db_service.create_task(session, escrow_address=escrow_address, chain_id=chain_id)
        task = db_service.get_task_by_id(session, task_id, for_update=True)

    if logger.isEnabledFor(logging.DEBUG):
        logger.debug("process_intermediate_results for escrow %s", escrow_address)
        logger.debug("Task id %s, %s", getattr(task, "id", None), getattr(task, "__dict__", None))

    initial_gt_stats = {
        (gt_image_stat.cvat_task_id, gt_image_stat.gt_frame_id): {
            "failed_attempts": gt_image_stat.failed_attempts,
            "acceptances_count": gt_image_stat.acceptances_count,
        }
        for gt_image_stat in db_service.get_task_gt_stats(session, task.id)
    }

    validator = _TaskValidator(
        escrow_address=escrow_address,
        chain_id=chain_id,
        manifest=manifest,
        job_annotations=job_annotations,
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
            if value["failed_attempts"] >= Config.validation.gt_ban_threshold:
                cvat_task_id_to_failed_val_frames.setdefault(cvat_task_id, []).append(val_frame_id)

        for cvat_task_id, val_frame_ids in cvat_task_id_to_failed_val_frames.items():
            cvat_api.disable_validation_frames(cvat_task_id, frames_to_disable=val_frame_ids)
            jobs_with_honeypots_to_be_shuffled = []

            for val_frame_id in val_frame_ids:
                jobs_with_honeypots_to_be_shuffled.extend(
                    validation_result.val_frame_id_to_jobs[val_frame_id]
                )

            jobs_with_honeypots_to_be_shuffled = set(jobs_with_honeypots_to_be_shuffled)
            cvat_api.shuffle_honeypots_in_jobs(jobs_with_honeypots_to_be_shuffled)

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
