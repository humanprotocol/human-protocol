from __future__ import annotations

import logging
from collections import Counter
from functools import cached_property
from typing import TYPE_CHECKING, TypeVar

import numpy as np

import src.cvat.api_calls as cvat_api
import src.models.validation as db_models
import src.services.validation as db_service
from src.core.config import Config
from src.core.gt_stats import GtKey, ValidationFrameStats
from src.core.validation_errors import TooFewGtError, TooSlowAnnotationError
from src.core.validation_meta import JobMeta, ResultMeta, ValidationMeta
from src.core.validation_results import ValidationFailure, ValidationSuccess
from src.db.utils import ForUpdateParams
from src.handlers.validation.common import (
    UNKNOWN_QUALITY,
    _HoneypotUpdateResult,
    _JobResults,
    _ValidationResult,
)
from src.handlers.validation.quality_checkers.factory import create_quality_checker
from src.utils import grouped
from src.utils.formatting import value_and_percent

if TYPE_CHECKING:
    from collections.abc import Callable, Sequence

    from sqlalchemy.orm import Session

    from src.core.annotation_meta import AnnotationMeta
    from src.core.gt_stats import GtStats
    from src.core.manifest import ManifestBase

_K = TypeVar("_K")


class _TaskHoneypotManager:
    def __init__(
        self,
        task: db_models.Task,
        manifest: ManifestBase,
        *,
        annotation_meta: AnnotationMeta,
        gt_stats: GtStats,
        validation_result: _ValidationResult,
        logger: logging.Logger,
        rng: np.random.Generator | None = None,
    ):
        self.task = task
        self.logger = logger
        self.annotation_meta = annotation_meta
        self.gt_stats = gt_stats
        self.validation_result = validation_result
        self.manifest = manifest

        self._job_annotation_meta_by_job_id = {
            meta.job_id: meta for meta in self.annotation_meta.jobs
        }

        if not rng:
            rng = np.random.default_rng()
        self.rng = rng

    @cached_property
    def _gt_frame_uses(self) -> dict[GtKey, int]:
        return {gt_key: gt_stat.total_uses for gt_key, gt_stat in self.gt_stats.items()}

    def _select_random_least_used(
        self,
        items: Sequence[_K],
        count: int,
        *,
        key: Callable[[_K], int] | None = None,
        rng: np.random.Generator | None = None,
    ) -> Sequence[_K]:
        """
        Selects 'count' least used items randomly, without repetition.
        'key' can be used to provide a custom item count function.
        """
        if not rng:
            rng = self.rng

        if not key:
            item_counts = Counter(items)
            key = item_counts.__getitem__

        pick = set()
        for randval in rng.random(count):
            # TODO: optimize like in https://github.com/cvat-ai/cvat/pull/8857 if needed
            least_use_count = min(key(item) for item in items if item not in pick)
            least_used_items = [
                item for item in items if key(item) == least_use_count if item not in pick
            ]
            pick.add(least_used_items[int(randval * len(least_used_items))])

        return pick

    def _get_available_gt(self) -> tuple[GtStats, dict[int, set[GtKey]]]:
        task_id_to_gt_keys = {}
        for task_id, task_val_layout in self.validation_result.task_id_to_val_layout.items():
            # Here we assume that all the tasks with the same label set use the same GT frames
            task_validation_frames = task_val_layout.validation_frames
            task_frame_names = self.validation_result.task_id_to_frame_names[task_id]
            task_labels = self.validation_result.task_id_to_labels[task_id]
            task_gt_keys = {
                GtKey(filename=task_frame_names[f], labels=task_labels)
                for f in task_validation_frames
            }

            # Populate missing entries for unused GT frames.
            # Not all the GT frames may be present in an iteration results.
            for gt_key in task_gt_keys:
                if gt_key not in self.gt_stats:
                    self.gt_stats[gt_key] = ValidationFrameStats()

            task_id_to_gt_keys[task_id] = task_gt_keys

        if max_gt_share := Config.validation.max_gt_share:
            # Limit maximum used GT frames in the dataset. This allows us to get strong
            # guarantees about GT frame uses during validation,
            # resulting in clear exclusion rates of complex or invalid GT.
            # Count GT frames per label set to avoid situations with empty GT sets
            # for some labels or tasks after limiting GT percent in the whole dataset.
            # Note that different task types can have different label setups in tasks, e.g.
            # - skeleton tasks have 1 point label per task
            # - bbox tasks may have several labels per task
            # All these cases are expected to use the same GT per label set.
            for label_set_task_ids in grouped(
                self.validation_result.task_id_to_labels,
                key=lambda t: frozenset(self.validation_result.task_id_to_labels[t]),
            ).values():
                regular_frames_count = 0
                gt_keys = None

                for task_id in label_set_task_ids:
                    task_gt_keys = task_id_to_gt_keys[task_id]
                    if gt_keys is None:
                        gt_keys = task_gt_keys
                    else:
                        # Assume that all the tasks with the same label set use the same GT
                        assert gt_keys == task_gt_keys

                    task_val_layout = self.validation_result.task_id_to_val_layout[task_id]
                    task_frame_names = self.validation_result.task_id_to_frame_names[task_id]
                    task_regular_frames_count = (
                        len(task_frame_names) - len(task_gt_keys) - task_val_layout.honeypot_count
                    )

                    regular_frames_count += task_regular_frames_count

                assert gt_keys is not None

                gt_frames_count = len(gt_keys)
                total_frames_count = regular_frames_count + gt_frames_count
                enabled_gt_keys = {k for k in gt_keys if self.gt_stats[k].enabled}
                current_gt_share = len(enabled_gt_keys) / (total_frames_count or 1)
                max_usable_gt_share = min(gt_frames_count / (total_frames_count or 1), max_gt_share)
                max_gt_count = min(int(max_gt_share * total_frames_count), gt_frames_count)
                has_updates = False
                if max_gt_count < len(enabled_gt_keys):
                    # disable some validation frames, take the least used ones
                    pick = self._select_random_least_used(
                        enabled_gt_keys,
                        count=len(enabled_gt_keys) - max_gt_count,
                        key=lambda k: self.gt_stats[k].total_uses,
                    )

                    enabled_gt_keys.difference_update(pick)
                    has_updates = True
                elif (
                    # Allow restoring GT frames on max limit config changes
                    current_gt_share < max_usable_gt_share
                ):
                    # add more validation frames, take the most used ones
                    pick = self._select_random_least_used(
                        enabled_gt_keys,
                        count=max_gt_count - len(enabled_gt_keys),
                        key=lambda k: -self.gt_stats[k].total_uses,
                    )

                    enabled_gt_keys.update(pick)
                    has_updates = True

                if has_updates:
                    for gt_key in gt_keys:
                        self.gt_stats[gt_key].enabled = gt_key in enabled_gt_keys

        return {
            gt_key
            for gt_key, gt_stat in self.gt_stats.items()
            if gt_stat.enabled
            if not Config.validation.enable_gt_bans
            or (gt_stat.rating > 1 - self.manifest.validation.min_quality)
        }, task_id_to_gt_keys

    def _check_warmup_annotation_speed(self):
        validation_result = self.validation_result
        rejected_jobs = validation_result.rejected_jobs

        current_iteration = self.task.iteration + 1
        total_jobs_count = len(self.annotation_meta.jobs)
        completed_jobs_count = total_jobs_count - len(rejected_jobs)
        current_progress = completed_jobs_count / (total_jobs_count or 1) * 100
        if (
            (Config.validation.warmup_iterations > 0)
            and (Config.validation.min_warmup_progress > 0)
            and (Config.validation.warmup_iterations <= current_iteration)
            and (current_progress < Config.validation.min_warmup_progress)
        ):
            self.logger.warning(
                f"Escrow validation failed for escrow_address={self.task.escrow_address}:"
                f" progress is too slow. Min required {Config.validation.min_warmup_progress:.2f}%"
                f" after the first {Config.validation.warmup_iterations} iterations,"
                f" got {current_progress:.2f} after the {current_iteration} iteration."
                " Annotation will be stopped for a manual review."
            )
            raise TooSlowAnnotationError(
                current_progress=current_progress, current_iteration=current_iteration
            )

    def update_honeypots(self) -> _HoneypotUpdateResult:
        gt_stats = self.gt_stats
        validation_result = self.validation_result
        rejected_jobs = validation_result.rejected_jobs

        # Update honeypots in jobs
        all_available_gt_keys, task_id_to_gt_keys = self._get_available_gt()

        if self.logger.isEnabledFor(logging.DEBUG):
            self.logger.debug(
                "Escrow validation for escrow_address={}: iteration: {}"
                ", available GT count: {} ({:.4f}%, banned {})"
                ", remaining jobs count: {} ({:.4f}%)".format(
                    self.task.escrow_address,
                    self.task.iteration,
                    *value_and_percent(len(all_available_gt_keys), len(gt_stats)),
                    len(gt_stats) - len(all_available_gt_keys),
                    *value_and_percent(len(rejected_jobs), len(self.annotation_meta.jobs)),
                ),
            )

        should_complete = False

        self._check_warmup_annotation_speed()

        gt_frame_uses = self._gt_frame_uses

        tasks_with_rejected_jobs = grouped(
            rejected_jobs, key=lambda jid: self._job_annotation_meta_by_job_id[jid].task_id
        )

        # Update honeypots in rejected jobs
        for cvat_task_id, task_rejected_jobs in tasks_with_rejected_jobs.items():
            if not task_rejected_jobs:
                continue

            task_gt_keys = task_id_to_gt_keys[cvat_task_id]
            task_available_gt_keys = task_gt_keys.intersection(all_available_gt_keys)
            if (
                len(task_available_gt_keys) / len(task_gt_keys)
                < Config.validation.min_available_gt_threshold
            ):
                self.logger.warning(
                    f"Validation for escrow_address={self.task.escrow_address}: "
                    f"Too many validation frames excluded in the task {cvat_task_id} "
                    f"(required: {Config.validation.min_available_gt_threshold * 100:.4f}%, "
                    f"left: {(len(task_available_gt_keys) / len(task_gt_keys) * 100):.4f}%), "
                    "stopping annotation"
                )
                return _HoneypotUpdateResult(
                    updated_gt_stats=gt_stats, can_continue_annotation=False
                )

            task_validation_layout = validation_result.task_id_to_val_layout[cvat_task_id]

            if len(task_available_gt_keys) < task_validation_layout.frames_per_job_count:
                # TODO: value from the manifest can be different from what's in the task
                # because exchange oracle can use size multipliers for tasks
                # Need to sync these values later (maybe by removing it from the manifest)
                self.logger.warning(
                    f"Validation for escrow_address={self.task.escrow_address}: "
                    f"Too few validation frames left in the task {cvat_task_id} "
                    f"(required: {task_validation_layout.frames_per_job_count}, "
                    f"left: {len(task_available_gt_keys)}), "
                    "stopping annotation"
                )
                return _HoneypotUpdateResult(
                    updated_gt_stats=gt_stats, can_continue_annotation=False
                )

            task_frame_names = validation_result.task_id_to_frame_names[cvat_task_id]
            task_labels = validation_result.task_id_to_labels[cvat_task_id]
            task_validation_frame_to_gt_key = {
                validation_frame: GtKey(
                    filename=task_frame_names[validation_frame], labels=task_labels
                )
                for validation_frame in task_validation_layout.validation_frames
            }

            task_available_validation_frames = [
                validation_frame
                for validation_frame in task_validation_layout.validation_frames
                if task_validation_frame_to_gt_key[validation_frame] in task_available_gt_keys
            ]

            task_honeypot_to_index: dict[int, int] = {
                honeypot: i for i, honeypot in enumerate(task_validation_layout.honeypot_frames)
            }  # honeypot -> honeypot list index

            task_updated_honeypot_real_frames = task_validation_layout.honeypot_real_frames.copy()

            for job_id in task_rejected_jobs:
                job_frame_range = self._job_annotation_meta_by_job_id[job_id].job_frame_range
                job_honeypots = sorted(
                    set(task_validation_layout.honeypot_frames).intersection(job_frame_range)
                )

                # Choose new unique validation frames for the job
                job_validation_frames = self._select_random_least_used(
                    task_available_validation_frames,
                    count=len(job_honeypots),
                    key=lambda k: gt_frame_uses[task_validation_frame_to_gt_key[k]],
                )
                for job_honeypot, job_validation_frame in zip(
                    job_honeypots, job_validation_frames, strict=False
                ):
                    gt_frame_uses[task_validation_frame_to_gt_key[job_validation_frame]] += 1
                    honeypot_index = task_honeypot_to_index[job_honeypot]
                    task_updated_honeypot_real_frames[honeypot_index] = job_validation_frame

                # Make sure honeypots do not repeat in jobs
                assert len(
                    {
                        task_updated_honeypot_real_frames[task_honeypot_to_index[honeypot]]
                        for honeypot in job_honeypots
                    }
                ) == len(job_honeypots)

            # Don't use disabled frames to avoid request fails because of
            # the already accepted jobs with (possibly newly) excluded frames.
            # The updated honeypots will include unmodified jobs as well.
            cvat_api.update_task_validation_layout(
                cvat_task_id,
                honeypot_real_frames=task_updated_honeypot_real_frames,
            )

        # Update GT use counts
        for gt_key, gt_stat in gt_stats.items():
            gt_stat.total_uses = gt_frame_uses[gt_key]

        return _HoneypotUpdateResult(
            updated_gt_stats=gt_stats, can_continue_annotation=not should_complete
        )


def process_intermediate_results(  # noqa: PLR0912
    session: Session,
    *,
    escrow_address: str,
    chain_id: int,
    meta: AnnotationMeta,
    manifest: ManifestBase,
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
        gt_stat.gt_key: ValidationFrameStats(
            failed_attempts=gt_stat.failed_attempts,
            accepted_attempts=gt_stat.accepted_attempts,
            accumulated_quality=gt_stat.accumulated_quality,
            total_uses=gt_stat.total_uses,
            enabled=gt_stat.enabled,
        )
        for gt_stat in db_service.get_task_gt_stats(session, task.id)
    }

    checker = create_quality_checker(
        manifest,
        escrow_address,
        chain_id,
        meta=unchecked_jobs_meta,
        gt_stats=gt_stats,
    )

    validation_result = checker.validate()
    job_results = validation_result.job_results
    rejected_jobs = validation_result.rejected_jobs

    if logger.isEnabledFor(logging.DEBUG):
        logger.debug("Validation results %s", validation_result)
        logger.debug(
            "Task validation results for escrow_address=%s: %s",
            escrow_address,
            ", ".join(f"{k}: {v:.2f}" for k, v in job_results.items()),
        )

    gt_stats = validation_result.gt_stats

    if (Config.validation.max_escrow_iterations > 0) and (
        Config.validation.max_escrow_iterations <= task.iteration
    ):
        logger.info(
            f"Validation for escrow_address={escrow_address}:"
            f" too many iterations, stopping annotation"
        )
        should_complete = True
    elif rejected_jobs and gt_stats:
        honeypot_manager = _TaskHoneypotManager(
            task,
            manifest,
            annotation_meta=meta,
            gt_stats=gt_stats,
            validation_result=validation_result,
            logger=logger,
        )

        honeypot_update_result = honeypot_manager.update_honeypots()
        if not honeypot_update_result.can_continue_annotation:
            should_complete = True

        gt_stats = honeypot_update_result.updated_gt_stats

    if gt_stats:
        if logger.isEnabledFor(logging.DEBUG):
            logger.debug("Updating GT stats: %s", gt_stats)

        db_service.update_gt_stats(session, task.id, gt_stats)

    job_final_result_ids: dict[str, str] = {}

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

    # Include final results for all jobs
    job_results: _JobResults = {
        job.cvat_id: task_validation_results[
            validation_result_id_to_meta_id[job_final_result_ids[job.id]]
        ].annotation_quality
        for job in task_jobs
    }

    return ValidationSuccess(
        job_results=job_results,
        validation_meta=validation_meta,
        average_quality=np.mean(
            [v for v in job_results.values() if v != UNKNOWN_QUALITY and v >= 0] or [0]
        ),
    )
