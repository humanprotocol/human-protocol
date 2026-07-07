from __future__ import annotations

from typing import TYPE_CHECKING

import src.cvat.api_calls as cvat_api
from src.core.gt_stats import GtKey, ValidationFrameStats
from src.core.validation_errors import LowAccuracyError, TooFewGtError
from src.handlers.validation.common import UNKNOWN_QUALITY
from src.handlers.validation.quality_checkers.base import TaskQualityChecker

if TYPE_CHECKING:
    from src.cvat.interface import QualityReportData
    from src.handlers.validation.common import _HoneypotFrameToValFrame, _JobResults, _RejectedJobs


class ImageTaskQualityChecker(TaskQualityChecker):
    def _validate_jobs(self) -> None:
        manifest = self._require_field(self.manifest)
        meta = self._require_field(self._meta)
        if manifest.version != 1:
            raise NotImplementedError

        job_results: _JobResults = {}
        rejected_jobs: _RejectedJobs = {}

        cvat_task_ids = {job_meta.task_id for job_meta in meta.jobs}

        task_id_to_quality_report_data: dict[int, QualityReportData] = {}
        task_id_to_val_layout: dict[int, cvat_api.models.TaskValidationLayoutRead] = {}
        task_id_to_honeypots_mapping: dict[int, _HoneypotFrameToValFrame] = {}

        # store sequence of frame names for each task
        # task honeypot with frame index matches the sequence[index]
        task_id_to_sequence_of_frame_names: dict[int, list[str]] = {}

        task_id_to_labels: dict[int, list[str]] = {}

        min_quality = manifest.validation.min_quality

        job_id_to_quality_report: dict[int, cvat_api.models.QualityReport] = {}

        for cvat_task_id in cvat_task_ids:
            # obtain quality report details
            task_labels = cvat_api.get_task_labels(cvat_task_id)
            task_quality_report = cvat_api.get_task_quality_report(cvat_task_id)
            task_quality_report_data = cvat_api.get_quality_report_data(task_quality_report.id)
            task_id_to_quality_report_data[cvat_task_id] = task_quality_report_data

            # obtain task validation layout and define honeypots mapping
            task_val_layout = cvat_api.get_task_validation_layout(cvat_task_id)
            task_honeypot_frame_to_real = {
                f: task_val_layout.honeypot_real_frames[idx]
                for idx, f in enumerate(task_val_layout.honeypot_frames)
            }
            task_id_to_val_layout[cvat_task_id] = task_val_layout
            task_id_to_honeypots_mapping[cvat_task_id] = task_honeypot_frame_to_real
            task_id_to_sequence_of_frame_names[cvat_task_id] = [
                frame.name for frame in cvat_api.get_task_data_meta(cvat_task_id).frames
            ]
            task_id_to_labels[cvat_task_id] = task_labels

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
            task_frame_names = task_id_to_sequence_of_frame_names[cvat_task_id]
            task_honeypots = set(task_id_to_val_layout[cvat_task_id].honeypot_frames)
            task_honeypots_mapping = task_id_to_honeypots_mapping[cvat_task_id]
            task_labels = task_id_to_labels[cvat_task_id]

            job_honeypots = task_honeypots & set(job_meta.job_frame_range)
            if not job_honeypots:
                job_results[cvat_job_id] = UNKNOWN_QUALITY
                rejected_jobs[cvat_job_id] = TooFewGtError
                continue

            for honeypot in job_honeypots:
                val_frame = task_honeypots_mapping[honeypot]
                val_frame_name = task_frame_names[val_frame]
                val_frame_key = GtKey(filename=val_frame_name, labels=task_labels)

                result = task_quality_report_data.frame_results[str(honeypot)]
                self._gt_stats.setdefault(val_frame_key, ValidationFrameStats())
                self._gt_stats[val_frame_key].accumulated_quality += result.annotations.accuracy

                if result.annotations.accuracy < min_quality:
                    self._gt_stats[val_frame_key].failed_attempts += 1
                else:
                    self._gt_stats[val_frame_key].accepted_attempts += 1

            # assess job quality
            job_quality_report = job_id_to_quality_report[cvat_job_id]

            accuracy = job_quality_report.summary.accuracy

            job_results[cvat_job_id] = accuracy

            if accuracy < min_quality:
                rejected_jobs[cvat_job_id] = LowAccuracyError()

        for gt_stat in self._gt_stats.values():
            gt_stat.total_uses = max(
                gt_stat.total_uses,
                gt_stat.failed_attempts + gt_stat.accepted_attempts,
                # at the first iteration we have no information on total uses
                # from previous iterations, so we derive it from the validation results
            )

        self._job_results = job_results
        self._rejected_jobs = rejected_jobs
        self._task_id_to_val_layout = task_id_to_val_layout
        self._task_id_to_honeypots_mapping = task_id_to_honeypots_mapping
        self._task_id_to_sequence_of_frame_names = task_id_to_sequence_of_frame_names
        self._task_id_to_labels = task_id_to_labels
