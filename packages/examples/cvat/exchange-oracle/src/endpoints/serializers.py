from contextlib import ExitStack, suppress
from typing import Literal, Optional, Union

from human_protocol_sdk.storage import StorageFileNotFoundError
from sqlalchemy.orm import Session

import src.services.cvat as cvat_service
from src.chain.escrow import get_escrow_manifest
from src.core.manifest import TaskManifest
from src.db import SessionLocal
from src.schemas import exchange as service_api
from src.utils.assignments import (
    compose_assignment_url,
    get_default_assignment_size,
    parse_manifest,
)


def serialize_job(
    project: Union[str, cvat_service.Project],
    *,
    manifest: Union[None, TaskManifest, Literal[False]] = None,
    session: Optional[Session] = None,
) -> Optional[service_api.JobResponse]:
    with ExitStack() as es:
        if not session:
            session = es.enter_context(SessionLocal.begin())

        if isinstance(project, str):
            project = cvat_service.get_project_by_id(session, project)
        elif not isinstance(project, cvat_service.Project):
            assert False

        if manifest is None:
            with suppress(StorageFileNotFoundError):
                manifest = parse_manifest(
                    get_escrow_manifest(project.chain_id, project.escrow_address)
                )

        return service_api.JobResponse(
            id=project.id,
            escrow_address=project.escrow_address,
            title=f"Job {project.escrow_address[:10]}",
            description=manifest.annotation.description if manifest else None,
            bounty=str(manifest.job_bounty) if manifest else None,
            size=get_default_assignment_size(manifest) if manifest else None,
            job_type=project.job_type,
            status=project.status,
        )


def serialize_assignment(
    assignment: Union[str, cvat_service.Assignment],
    *,
    project: Union[str, cvat_service.Project],
    manifest: Union[None, TaskManifest, Literal[False]] = None,
    session: Optional[Session] = None,
) -> service_api.AssignmentResponse:
    with ExitStack() as es:
        if not session:
            session = es.enter_context(SessionLocal.begin())

        if isinstance(assignment, str):
            assignment = cvat_service.get_assignments_by_id(session, [assignment])[0]
        elif not isinstance(assignment, cvat_service.Assignment):
            assert False

        if isinstance(project, str):
            project = cvat_service.get_project_by_id(session, project)
        elif not isinstance(project, cvat_service.Project):
            assert False

        if manifest is None:
            with suppress(StorageFileNotFoundError):
                manifest = parse_manifest(
                    get_escrow_manifest(project.chain_id, project.escrow_address)
                )

        return service_api.AssignmentResponse(
            id=assignment.id,
            escrow_address=assignment.user_wallet_address,
            size=get_default_assignment_size(manifest) if manifest else None,
            job_type=project.job_type,
            status=assignment.status,
            bounty=str(manifest.job_bounty) if manifest else None,
            url=compose_assignment_url(
                task_id=assignment.job.cvat_task_id,
                job_id=assignment.cvat_job_id,
                project=project,
            )
            if not assignment.is_finished
            else None,
            started_at=assignment.created_at,
            finishes_at=assignment.expires_at,
            finished_at=assignment.completed_at,
        )
