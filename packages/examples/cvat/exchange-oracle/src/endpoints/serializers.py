from contextlib import ExitStack, suppress
from typing import Literal, Optional, Union

from human_protocol_sdk.storage import StorageFileNotFoundError
from sqlalchemy.orm import Session

import src.services.cvat as cvat_service
from src.chain.escrow import get_escrow_manifest
from src.core.manifest import TaskManifest
from src.core.types import AssignmentStatuses, ProjectStatuses
from src.db import SessionLocal
from src.schemas import exchange as service_api
from src.utils.assignments import compose_assignment_url, parse_manifest


def serialize_job(
    project: Union[str, cvat_service.Project],
    *,
    manifest: Union[None, TaskManifest, Literal[False]] = None,
    session: Optional[Session] = None,
) -> service_api.JobResponse:
    with ExitStack() as es:
        if not session:
            session = es.enter_context(SessionLocal.begin())

        if isinstance(project, str):
            project = cvat_service.get_project_by_id(session, project)
            assert project
        elif not isinstance(project, cvat_service.Project):
            assert False

        if manifest is None:
            with suppress(StorageFileNotFoundError):
                manifest = parse_manifest(
                    get_escrow_manifest(project.chain_id, project.escrow_address)
                )

        if project.status == ProjectStatuses.canceled:
            api_status = service_api.JobStatuses.canceled
        elif project.status in [
            ProjectStatuses.annotation,
            ProjectStatuses.validation,
            ProjectStatuses.completed,
        ]:
            api_status = service_api.JobStatuses.active
        elif project.status == ProjectStatuses.recorded:
            api_status = service_api.JobStatuses.completed
        else:
            raise NotImplementedError(f"Unknown status {project.status}")

        return service_api.JobResponse(
            escrow_address=project.escrow_address,
            chain_id=project.chain_id,
            job_type=project.job_type,
            status=api_status,
            job_title=f"Job {project.escrow_address[:10]}",
            job_description=manifest.annotation.description if manifest else None,
            reward_amount=str(manifest.job_bounty) if manifest else None,
            created_at=project.created_at,
        )


def serialize_assignment(
    assignment: Union[str, cvat_service.Assignment],
    *,
    project: Union[None, str, cvat_service.Project] = None,
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

        if project is None:
            project = assignment.job.project
        elif isinstance(project, str):
            project = cvat_service.get_project_by_id(session, project)
            assert project
        elif not isinstance(project, cvat_service.Project):
            assert False

        if manifest is None:
            with suppress(StorageFileNotFoundError):
                manifest = parse_manifest(
                    get_escrow_manifest(project.chain_id, project.escrow_address)
                )

        assignment_status_mapping = {
            AssignmentStatuses.created: service_api.AssignmentStatuses.active,
            AssignmentStatuses.completed: service_api.AssignmentStatuses.completed,
            AssignmentStatuses.expired: service_api.AssignmentStatuses.expired,
            AssignmentStatuses.rejected: service_api.AssignmentStatuses.rejected,
            AssignmentStatuses.canceled: service_api.AssignmentStatuses.canceled,
        }
        if assignment.status == AssignmentStatuses.completed and project.status in [
            ProjectStatuses.validation,
            ProjectStatuses.completed,
            ProjectStatuses.annotation,
        ]:
            api_status = service_api.AssignmentStatuses.validation
        else:
            api_status = assignment_status_mapping[assignment.status]

        updated_at = None
        if assignment.status == AssignmentStatuses.completed:
            updated_at = assignment.completed_at
        elif assignment.status in [
            AssignmentStatuses.expired,
            AssignmentStatuses.canceled,
            AssignmentStatuses.rejected,
        ]:
            updated_at = assignment.expires_at

        return service_api.AssignmentResponse(
            assignment_id=assignment.id,
            escrow_address=project.escrow_address,
            chain_id=project.chain_id,
            job_type=project.job_type,
            status=api_status,
            reward_amount=str(manifest.job_bounty) if manifest else None,
            url=compose_assignment_url(
                task_id=assignment.job.cvat_task_id,
                job_id=assignment.cvat_job_id,
                project=project,
            )
            if not assignment.is_finished
            else None,
            created_at=assignment.created_at,
            expires_at=assignment.expires_at,
            updated_at=updated_at,
        )
