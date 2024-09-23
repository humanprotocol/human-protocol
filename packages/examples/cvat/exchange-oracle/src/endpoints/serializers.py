from contextlib import ExitStack, suppress
from typing import Literal

from human_protocol_sdk.storage import StorageFileNotFoundError
from sqlalchemy import func
from sqlalchemy.orm import Session

import src.services.cvat as cvat_service
from src.chain.escrow import get_escrow_manifest
from src.core.manifest import TaskManifest
from src.core.types import AssignmentStatuses, ProjectStatuses
from src.db import SessionLocal
from src.schemas import exchange as service_api
from src.utils.assignments import compose_assignment_url, parse_manifest


def serialize_job(
    project: str | cvat_service.Project,
    *,
    manifest: None | TaskManifest | Literal[False] = None,
    session: Session | None = None,
) -> service_api.JobResponse:
    with ExitStack() as es:
        if not session:
            session = es.enter_context(SessionLocal.begin())

        if isinstance(project, str):
            project = cvat_service.get_project_by_id(session, project)
            assert project
        elif not isinstance(project, cvat_service.Project):
            raise TypeError(
                f"Project must be either project id "
                f"or a cvat_service.Project instance, not {project!r}"
            )

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

        updated_at = (
            session.query(func.max(cvat_service.Job.updated_at))
            .filter(cvat_service.Job.cvat_project_id == project.cvat_id)
            .scalar()
        )
        return service_api.JobResponse(
            escrow_address=project.escrow_address,
            chain_id=project.chain_id,
            job_type=project.job_type,
            status=api_status,
            job_description=manifest.annotation.description if manifest else None,
            reward_amount=str(manifest.job_bounty) if manifest else None,
            reward_token=(
                service_api.DEFAULT_TOKEN
            ),  # TODO: this field requires a value to be kept by response_model_exclude_unset=True
            created_at=project.created_at,
            updated_at=updated_at,
            qualifications=manifest.qualifications,
        )


def serialize_assignment(
    assignment: str | cvat_service.Assignment,
    *,
    project: None | str | cvat_service.Project = None,
    manifest: None | TaskManifest | Literal[False] = None,
    session: Session | None = None,
) -> service_api.AssignmentResponse:
    with ExitStack() as es:
        if not session:
            session = es.enter_context(SessionLocal.begin())

        if isinstance(assignment, str):
            assignment = cvat_service.get_assignments_by_id(session, [assignment])[0]
        elif not isinstance(assignment, cvat_service.Assignment):
            raise TypeError(
                f"Assignment must be either assignment id "
                f"or a cvat_service.Project instance, not {assignment!r}"
            )

        if project is None:
            project = assignment.job.project
        elif isinstance(project, str):
            project = cvat_service.get_project_by_id(session, project)
            assert project
        elif not isinstance(project, cvat_service.Project):
            raise TypeError(
                f"Project must be either project id "
                f"or a cvat_service.Project instance, not {project!r}"
            )

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

        updated_at = assignment.created_at
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
            reward_token=(
                service_api.DEFAULT_TOKEN
            ),  # TODO: this field requires a value to be kept by response_model_exclude_unset=True
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
