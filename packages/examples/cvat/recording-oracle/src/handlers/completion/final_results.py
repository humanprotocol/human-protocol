from __future__ import annotations

from typing import TYPE_CHECKING

import numpy as np

import src.services.validation as db_service
from src.core.validation_meta import JobMeta, ResultMeta, ValidationMeta
from src.core.validation_results import FinalResult
from src.db.utils import ForUpdateParams
from src.handlers.completion.task_exporters.factory import create_exporter
from src.handlers.validation.common import UNKNOWN_QUALITY, _JobResults

if TYPE_CHECKING:
    import logging

    from sqlalchemy.orm import Session

    from src.core.annotation_meta import AnnotationMeta
    from src.core.manifest import ManifestBase


def process_final_results(
    session: Session,
    *,
    escrow_address: str,
    chain_id: int,
    meta: AnnotationMeta,
    manifest: ManifestBase,
    logger: logging.Logger,
) -> FinalResult:
    assert logger  # unused

    task = db_service.get_task_by_escrow_address(
        session,
        escrow_address,
        for_update=ForUpdateParams(
            nowait=True
        ),  # should not happen, but waiting should not block processing
    )
    if not task:
        raise AssertionError(f"Validation results for escrow {escrow_address} not found")

    exporter = create_exporter(manifest, escrow_address, chain_id, session)
    resulting_annotations = exporter.export()

    job_final_result_ids: dict[str, str] = {}

    for job_meta in meta.jobs:
        job = db_service.get_job_by_cvat_id(session, job_meta.job_id)
        if not job:
            raise AssertionError(
                f"Can't find validation results for job " f"{job_meta.job_id} ({escrow_address=})"
            )

        assignment_validation_result = db_service.get_validation_result_by_assignment_id(
            session, job_meta.assignment_id
        )
        if not assignment_validation_result:
            raise AssertionError(
                f"Can't find validation results for assignments "
                f"{job_meta.assignment_id} ({escrow_address=})"
            )

        job_final_result_ids[job.id] = assignment_validation_result.id

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

    # Include final results for all jobs
    job_results: _JobResults = {
        job.cvat_id: task_validation_results[
            validation_result_id_to_meta_id[job_final_result_ids[job.id]]
        ].annotation_quality
        for job in task_jobs
    }

    return FinalResult(
        job_results=job_results,
        validation_meta=validation_meta,
        resulting_annotations=resulting_annotations,
        average_quality=np.mean(
            [v for v in job_results.values() if v != UNKNOWN_QUALITY and v >= 0] or [0]
        ),
    )
