from __future__ import annotations

import io
import logging
import os
from dataclasses import dataclass
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import TYPE_CHECKING, TypeVar

import datumaro as dm
import numpy as np

import src.cvat.api_calls as cvat_api
import src.services.validation as db_service
from src.core.annotation_meta import AnnotationMeta
from src.core.config import Config
from src.core.gt_stats import GtStats, ValidationFrameStats
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
    from src.cvat.interface import QualityReportData

DM_DATASET_FORMAT_MAPPING = {
    TaskTypes.image_label_binary: "cvat_images",
    TaskTypes.image_polygons: "coco_instances",
    TaskTypes.image_points: "coco_person_keypoints",
    TaskTypes.image_boxes: "coco_instances",
    TaskTypes.image_boxes_from_points: "coco_instances",
    TaskTypes.image_skeletons_from_boxes: "coco_person_keypoints",
}

DM_GT_DATASET_FORMAT_MAPPING = {
    TaskTypes.image_label_binary: "cvat_images",
    TaskTypes.image_points: "coco_instances",  # we compare points against boxes
    TaskTypes.image_polygons: "coco_instances",
    TaskTypes.image_boxes: "coco_instances",
    TaskTypes.image_boxes_from_points: "coco_instances",
    TaskTypes.image_skeletons_from_boxes: "coco_person_keypoints",
}

_JobResults = dict[int, float]

_RejectedJobs = dict[int, DatasetValidationError]

_HoneypotFrameId = int
_ValidationFrameId = int
_HoneypotFrameToValFrame = dict[_HoneypotFrameId, _ValidationFrameId]
_TaskIdToValidationLayout = dict[int, cvat_api.models.ITaskValidationLayoutRead]
_TaskIdToHoneypotsMapping = dict[int, _HoneypotFrameToValFrame]
_TaskIdToFrameNames = dict[int, list[str]]


@dataclass
class _ValidationResult:
    job_results: _JobResults
    rejected_jobs: _RejectedJobs
    updated_merged_dataset: io.BytesIO
    gt_stats: GtStats
    task_id_to_val_layout: _TaskIdToValidationLayout
    task_id_to_honeypots_mapping: _TaskIdToHoneypotsMapping
    task_id_to_frame_names: _TaskIdToFrameNames


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
        gt_stats: GtStats | None = None,
    ) -> None:
        self.escrow_address = escrow_address
        self.chain_id = chain_id
        self.manifest = manifest

        self._gt_stats: GtStats = gt_stats or {}
        self._merged_annotations: io.IOBase = merged_annotations

        self._updated_merged_dataset_archive: io.IOBase | None = None
        self._job_results: _JobResults | None = None
        self._rejected_jobs: _RejectedJobs | None = None

        self._temp_dir: Path | None = None
        self._input_gt_dataset: dm.Dataset | None = None
        self._meta: AnnotationMeta = meta

    def _require_field(self, field: T | None) -> T:
        assert field is not None
        return field

    def _gt_key_to_sample_id(self, gt_key: str) -> str:
        return gt_key

    def _parse_gt_dataset(self, gt_file_data: bytes) -> dm.Dataset:
        with TemporaryDirectory() as gt_temp_dir:
            gt_filename = os.path.join(gt_temp_dir, "gt_annotations.json")
            with open(gt_filename, "wb") as f:
                f.write(gt_file_data)

            gt_dataset = dm.Dataset.import_from(
                gt_filename,
                format=DM_GT_DATASET_FORMAT_MAPPING[self.manifest.annotation.type],
            )

            gt_dataset.init_cache()

            return gt_dataset

    def _load_gt_dataset(self):
        input_gt_bucket = BucketAccessInfo.parse_obj(self.manifest.validation.gt_url)
        gt_bucket_client = make_cloud_client(input_gt_bucket)
        gt_data = gt_bucket_client.download_file(input_gt_bucket.path)
        self._input_gt_dataset = self._parse_gt_dataset(gt_data)

    def _validate_jobs(self):
        manifest = self._require_field(self.manifest)
        meta = self._require_field(self._meta)

        job_results: _JobResults = {}
        rejected_jobs: _RejectedJobs = {}

        cvat_task_ids = {job_meta.task_id for job_meta in meta.jobs}

        task_id_to_quality_report_data: dict[int, QualityReportData] = {}
        task_id_to_val_layout: dict[int, cvat_api.models.TaskValidationLayoutRead] = {}
        task_id_to_honeypots_mapping: dict[int, _HoneypotFrameToValFrame] = {}

        # store sequence of frame names for each task
        # task honeypot with frame index matches the sequence[index]
        task_id_to_sequence_of_frame_names: dict[int, list[str]] = {}

        min_quality = manifest.validation.min_quality

        job_id_to_quality_report: dict[int, cvat_api.models.QualityReport] = {}

        for cvat_task_id in cvat_task_ids:
            # obtain quality report details
            task_quality_report = cvat_api.get_task_quality_report(cvat_task_id)
            task_quality_report_data = cvat_api.get_quality_report_data(task_quality_report.id)
            task_id_to_quality_report_data[cvat_task_id] = task_quality_report_data

            # obtain task validation layout and define honeypots mapping
            task_val_layout = cvat_api.get_task_validation_layout(cvat_task_id)
            honeypot_frame_to_real = {
                f: task_val_layout.honeypot_real_frames[idx]
                for idx, f in enumerate(task_val_layout.honeypot_frames)
            }
            task_id_to_val_layout[cvat_task_id] = task_val_layout
            task_id_to_honeypots_mapping[cvat_task_id] = honeypot_frame_to_real
            task_id_to_sequence_of_frame_names[cvat_task_id] = [
                frame.name for frame in cvat_api.get_task_data_meta(cvat_task_id).frames
            ]

            # obtain quality reports for each job from the task
            job_id_to_quality_report.update(
                {
                    quality_report.job_id: quality_report
                    for quality_report in cvat_api.get_jobs_quality_reports(task_quality_report.id)
                }
            )

        # accepted jobs from the previous epochs are not included
        for job_meta in meta.jobs:
            cvat_job_id = job_meta.job_id
            cvat_task_id = job_meta.task_id

            # assess quality of the job's honeypots
            task_quality_report_data = task_id_to_quality_report_data[cvat_task_id]
            sorted_task_frame_names = task_id_to_sequence_of_frame_names[cvat_task_id]
            task_honeypots = {int(frame) for frame in task_quality_report_data.frame_results}
            honeypots_mapping = task_id_to_honeypots_mapping[cvat_task_id]

            job_honeypots = task_honeypots & set(job_meta.job_frame_range)
            if not job_honeypots:
                job_results[cvat_job_id] = self.UNKNOWN_QUALITY
                rejected_jobs[cvat_job_id] = TooFewGtError
                continue

            for honeypot in job_honeypots:
                val_frame = honeypots_mapping[honeypot]
                val_frame_name = sorted_task_frame_names[val_frame]

                result = task_quality_report_data.frame_results[str(honeypot)]
                self._gt_stats.setdefault(val_frame_name, ValidationFrameStats())
                self._gt_stats[val_frame_name].accumulated_quality += result.annotations.accuracy

                if result.annotations.accuracy < min_quality:
                    self._gt_stats[val_frame_name].failed_attempts += 1
                else:
                    self._gt_stats[val_frame_name].accepted_attempts += 1

            # assess job quality
            job_quality_report = job_id_to_quality_report[cvat_job_id]

            accuracy = job_quality_report.summary.accuracy

            job_results[cvat_job_id] = accuracy

            if accuracy < min_quality:
                rejected_jobs[cvat_job_id] = LowAccuracyError()

        self._job_results = job_results
        self._rejected_jobs = rejected_jobs
        self._task_id_to_val_layout = task_id_to_val_layout
        self._task_id_to_honeypots_mapping = task_id_to_honeypots_mapping
        self._task_id_to_sequence_of_frame_names = task_id_to_sequence_of_frame_names

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

        # Remove prefixes if it can be done safely
        sample_ids = {sample.id for sample in merged_dataset}
        if all(
            sample_id.startswith(prefix) and (sample_id[len(prefix) :] not in sample_ids)
            for sample_id in sample_ids
        ):
            merged_dataset.transform(RemoveCommonPrefix, prefix=prefix)

        return merged_dataset

    def _prepare_merged_dataset(self):
        tempdir = self._require_field(self._temp_dir)
        manifest = self._require_field(self.manifest)
        merged_annotations = self._require_field(self._merged_annotations)
        input_gt_dataset = self._require_field(self._input_gt_dataset)

        merged_dataset_path = tempdir / "merged"
        merged_dataset_format = DM_DATASET_FORMAT_MAPPING[manifest.annotation.type]
        extract_zip_archive(merged_annotations, merged_dataset_path)

        merged_dataset = dm.Dataset.import_from(
            os.fspath(merged_dataset_path), format=merged_dataset_format
        )
        self._restore_original_image_paths(merged_dataset)
        self._put_gt_into_merged_dataset(input_gt_dataset, merged_dataset, manifest=manifest)

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
        cls, input_gt_dataset: dm.Dataset, merged_dataset: dm.Dataset, *, manifest: TaskManifest
    ) -> None:
        """
        Updates the merged dataset inplace, writing GT annotations corresponding to the task type.
        """

        match manifest.annotation.type:
            case TaskTypes.image_boxes.value | TaskTypes.image_polygons.value:
                merged_dataset.update(input_gt_dataset)
            case TaskTypes.image_points.value:
                merged_label_cat: dm.LabelCategories = merged_dataset.categories()[
                    dm.AnnotationType.label
                ]

                # we support no more than 1 label so far
                assert len(manifest.annotation.labels) == 1

                skeleton_label_id = next(
                    i for i, label in enumerate(merged_label_cat) if not label.parent
                )
                point_label_id = next(i for i, label in enumerate(merged_label_cat) if label.parent)

                for sample in input_gt_dataset:
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
                merged_dataset.update(input_gt_dataset)
            case TaskTypes.image_boxes_from_points:
                merged_dataset.update(input_gt_dataset)
            case TaskTypes.image_skeletons_from_boxes:
                # The original behavior of project_labels is broken for skeletons
                input_gt_dataset = dm.Dataset(input_gt_dataset)
                input_gt_dataset = input_gt_dataset.transform(
                    ProjectLabels, dst_labels=merged_dataset.categories()[dm.AnnotationType.label]
                )
                merged_dataset.update(input_gt_dataset)
            case _:
                raise AssertionError(f"Unknown task type {manifest.annotation.type}")

    def validate(self) -> _ValidationResult:
        with TemporaryDirectory() as tempdir:
            self._temp_dir = Path(tempdir)

            self._load_gt_dataset()
            self._validate_jobs()
            self._prepare_merged_dataset()

        return _ValidationResult(
            job_results=self._require_field(self._job_results),
            rejected_jobs=self._require_field(self._rejected_jobs),
            updated_merged_dataset=self._require_field(self._updated_merged_dataset_archive),
            gt_stats=self._require_field(self._gt_stats),
            task_id_to_val_layout=self._require_field(self._task_id_to_val_layout),
            task_id_to_honeypots_mapping=self._require_field(self._task_id_to_honeypots_mapping),
            task_id_to_frame_names=self._require_field(self._task_id_to_sequence_of_frame_names),
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
    should_complete = False

    task = db_service.get_task_by_escrow_address(
        session,
        escrow_address,
        for_update=ForUpdateParams(
            nowait=True
        ),  # should not happen, but waiting should not block processing
    )
    if task:
        # Skip assignments that were validated earlier
        validated_assignment_ids = {
            validation_result.assignment_id
            for validation_result in db_service.get_task_validation_results(session, task.id)
        }
        unchecked_jobs_meta = meta.skip_assignments(validated_assignment_ids)
    else:
        # Recording Oracle task represents all CVAT tasks related with the escrow
        task_id = db_service.create_task(session, escrow_address=escrow_address, chain_id=chain_id)
        task = db_service.get_task_by_id(session, task_id, for_update=True)
        unchecked_jobs_meta = meta

    if logger.isEnabledFor(logging.DEBUG):
        logger.debug("process_intermediate_results for escrow %s", escrow_address)
        logger.debug("Task id %s, %s", getattr(task, "id", None), getattr(task, "__dict__", None))

    gt_stats = {
        gt_image_stat.gt_frame_name: ValidationFrameStats(
            failed_attempts=gt_image_stat.failed_attempts,
            accepted_attempts=gt_image_stat.accepted_attempts,
            accumulated_quality=gt_image_stat.accumulated_quality,
        )
        for gt_image_stat in db_service.get_task_gt_stats(session, task.id)
    }

    validator = _TaskValidator(
        escrow_address=escrow_address,
        chain_id=chain_id,
        manifest=manifest,
        merged_annotations=merged_annotations,
        meta=unchecked_jobs_meta,
        gt_stats=gt_stats,
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

    gt_stats = validation_result.gt_stats
    if gt_stats:
        # cvat_task_id: {val_frame_id, ...}
        cvat_task_id_to_failed_val_frames: dict[int, set[int]] = {}
        rejected_job_ids = rejected_jobs.keys()

        if rejected_job_ids:
            job_id_to_task_id = {j.job_id: j.task_id for j in unchecked_jobs_meta.jobs}
            job_id_to_frame_range = {j.job_id: j.job_frame_range for j in unchecked_jobs_meta.jobs}

            # find validation frames to be disabled
            for rejected_job_id in rejected_job_ids:
                job_frame_range = job_id_to_frame_range[rejected_job_id]
                cvat_task_id = job_id_to_task_id[rejected_job_id]
                task_honeypots_mapping = validation_result.task_id_to_honeypots_mapping[
                    cvat_task_id
                ]
                job_honeypots = sorted(set(task_honeypots_mapping.keys()) & set(job_frame_range))
                validation_frames = [
                    val_frame
                    for honeypot, val_frame in task_honeypots_mapping.items()
                    if honeypot in job_honeypots
                ]
                sorted_task_frame_names = validation_result.task_id_to_frame_names[cvat_task_id]

                for val_frame in validation_frames:
                    val_frame_name = sorted_task_frame_names[val_frame]
                    val_frame_stats = gt_stats[val_frame_name]
                    if (
                        val_frame_stats.failed_attempts >= Config.validation.gt_ban_threshold
                        and not val_frame_stats.accepted_attempts
                    ):
                        cvat_task_id_to_failed_val_frames.setdefault(cvat_task_id, set()).add(
                            val_frame
                        )

        for cvat_task_id, task_bad_validation_frames in cvat_task_id_to_failed_val_frames.items():
            task_validation_layout = validation_result.task_id_to_val_layout[cvat_task_id]

            task_disabled_bad_frames = (
                set(task_validation_layout.disabled_frames) & task_bad_validation_frames
            )
            if task_disabled_bad_frames:
                logger.error(
                    "Logical error occurred while disabling validation frames "
                    f"for the task({task_id}). Frames {task_disabled_bad_frames} "
                    "are already disabled."
                )

            task_updated_disabled_frames = list(
                set(task_validation_layout.disabled_frames) | set(task_bad_validation_frames)
            )
            task_good_validation_frames = list(
                set(task_validation_layout.validation_frames) - set(task_updated_disabled_frames)
            )

            if len(task_good_validation_frames) < task_validation_layout.frames_per_job_count:
                should_complete = True
                logger.info(
                    f"Validation for escrow_address={escrow_address}: "
                    "Too few validation frames left "
                    f"(required: {task_validation_layout.frames_per_job_count}, "
                    f"left: {len(task_good_validation_frames)}) for the task({cvat_task_id}), "
                    "stopping annotation"
                )
                break

            task_honeypot_to_index: dict[int, int] = {
                honeypot: i for i, honeypot in enumerate(task_validation_layout.validation_frames)
            }  # honeypot -> list index

            task_honeypots_mapping = validation_result.task_id_to_honeypots_mapping[cvat_task_id]

            task_rejected_jobs = [
                j
                for j in unchecked_jobs_meta.jobs
                if j.job_id in rejected_job_ids and j.task_id == cvat_task_id
            ]

            task_updated_honeypot_real_frames = task_validation_layout.honeypot_real_frames.copy()
            for job in task_rejected_jobs:
                job_frame_range = job.job_frame_range
                job_honeypots = sorted(set(task_honeypots_mapping.keys()) & set(job_frame_range))

                job_honeypots_to_replace = []
                job_validation_frames_to_replace = []
                job_validation_frames_to_keep = []
                for honeypot in job_honeypots:
                    validation_frame = task_honeypots_mapping[honeypot]
                    if validation_frame in task_bad_validation_frames:
                        job_honeypots_to_replace.append(honeypot)
                        job_validation_frames_to_replace.append(validation_frame)
                    else:
                        job_validation_frames_to_keep.append(validation_frame)

                # choose new unique validation frames for the job
                assert not (
                    set(job_validation_frames_to_replace) & set(task_good_validation_frames)
                )
                job_available_validation_frames = list(
                    set(task_good_validation_frames) - set(job_validation_frames_to_keep)
                )

                rng = np.random.Generator(np.random.MT19937())
                new_job_validation_frames = rng.choice(
                    job_available_validation_frames,
                    replace=False,
                    size=len(job_validation_frames_to_replace),
                ).tolist()

                for honeypot, new_validation_frame in zip(
                    job_validation_frames_to_replace, new_job_validation_frames, strict=True
                ):
                    honeypot_index = task_honeypot_to_index[honeypot]
                    task_updated_honeypot_real_frames[honeypot_index] = new_validation_frame

                # Make sure honeypots do not repeat in jobs
                assert len(
                    {
                        task_updated_honeypot_real_frames[task_honeypot_to_index[honeypot]]
                        for honeypot in job_honeypots
                    }
                ) == len(job_honeypots)

            cvat_api.update_task_validation_layout(
                cvat_task_id,
                disabled_frames=task_updated_disabled_frames,
                honeypot_real_frames=task_updated_honeypot_real_frames,
            )

        if logger.isEnabledFor(logging.DEBUG):
            logger.debug("Updating GT stats: %s", gt_stats)

        db_service.update_gt_stats(session, task.id, gt_stats)

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

        # We consider only the last assignment as final even if there were assignments with higher
        # quality score. The reason for this is that during escrow annotation there are various
        # task changes possible, for instance:
        # - GT can be changed in the middle of the task annotation
        # - manifest can be updated with different quality parameters
        # etc. It can be considered more of a development or testing conditions so far,
        # according to the current system requirements, but it's likely to be
        # a normal requirement in the future.
        # Therefore, we use the logic: only the last job assignment can be considered
        # a final annotation result, regardless of the assignment quality.
        job_final_result_ids[job.id] = assignment_validation_result_id

    task_jobs = task.jobs

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
