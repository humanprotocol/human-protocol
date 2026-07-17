from __future__ import annotations

from typing import TYPE_CHECKING

import src.services.cvat as cvat_service
from src.core.tasks.audio_transcription.meta import CVAT_EXPORT_FORMAT, TaskResultsLayout
from src.handlers.job_completion.validators.base import JobValidator
from src.handlers.job_export.downloading import download_job_annotations
from src.handlers.job_export.results import (
    FileDescriptor,
    prepare_annotation_metafile,
    upload_escrow_results,
)

if TYPE_CHECKING:
    from src.models.cvat import Job


class AudioTranscriptionJobValidator(JobValidator):
    def _save_annotation_results(self) -> None:
        assert self.escrow_projects  # unused, but must hold a lock

        cvat_jobs = cvat_service.get_jobs_by_escrow_address(
            self.session, self.escrow_address, self.chain_id
        )

        self.logger.debug(
            f"Downloading annotations for the escrow (escrow_address={self.escrow_address})"
        )
        cvat_job_annotations = download_job_annotations(self.logger, CVAT_EXPORT_FORMAT, cvat_jobs)

        result_files: list[FileDescriptor] = [
            self._make_annotation_descriptor(job, cvat_job_annotations[job.cvat_id])
            for job in cvat_jobs
        ]
        result_files.append(prepare_annotation_metafile(jobs=cvat_jobs))

        self.logger.debug(
            f"Recording annotations for the escrow (escrow_address={self.escrow_address})"
        )
        upload_escrow_results(
            files=result_files, chain_id=self.chain_id, escrow_address=self.escrow_address
        )

    def _make_annotation_descriptor(self, job: Job, annotations: FileDescriptor) -> FileDescriptor:
        assignment = job.latest_assignment
        return FileDescriptor(
            filename=TaskResultsLayout.assignment_annotation_filename(job.cvat_id, assignment.id),
            file=annotations.file,
        )
