from datetime import timedelta
from typing import Optional

import src.cvat.api_calls as cvat_api
import src.services.cvat as cvat_service
from src.chain.escrow import get_escrow_manifest
from src.core.types import AssignmentStatuses, PlatformTypes, ProjectStatuses, TaskTypes
from src.db import SessionLocal
from src.schemas import exchange as service_api
from src.utils.assignments import (
    compose_assignment_url,
    get_default_assignment_size,
    get_default_assignment_timeout,
    parse_manifest,
)
from src.utils.requests import get_or_404
from src.utils.time import utcnow


def serialize_task(
    project_id: str, *, assignment_id: Optional[str] = None
) -> service_api.TaskResponse:
    with SessionLocal.begin() as session:
        project = cvat_service.get_project_by_id(session, project_id)

        assignment = None
        if assignment_id:
            assignment = cvat_service.get_assignments_by_id(session, [assignment_id])[0]

        manifest = parse_manifest(get_escrow_manifest(project.chain_id, project.escrow_address))

        serialized_assignment = None
        if assignment:
            serialized_assignment = service_api.AssignmentResponse(
                assignment_url=compose_assignment_url(
                    task_id=assignment.job.cvat_task_id,
                    job_id=assignment.cvat_job_id,
                    project=project,
                ),
                started_at=assignment.created_at,
                finishes_at=assignment.expires_at,
            )

        return service_api.TaskResponse(
            id=project.id,
            escrow_address=project.escrow_address,
            title=f"Task {project.escrow_address[:10]}",
            description=manifest.annotation.description,
            job_bounty=manifest.job_bounty,
            job_time_limit=get_default_assignment_timeout(manifest.annotation.type),
            job_size=get_default_assignment_size(manifest),
            job_type=project.job_type,
            platform=PlatformTypes.CVAT,
            assignment=serialized_assignment,
            status=project.status,
        )


def get_available_tasks() -> list[service_api.TaskResponse]:
    results = []

    with SessionLocal.begin() as session:
        cvat_projects = cvat_service.get_available_projects(session)

        for project in cvat_projects:
            results.append(serialize_task(project.id))

    return results


def get_tasks_by_assignee(
    wallet_address: Optional[str] = None,
) -> list[service_api.TaskResponse]:
    results = []

    with SessionLocal.begin() as session:
        cvat_projects = cvat_service.get_projects_by_assignee(
            session, wallet_address=wallet_address
        )
        user_assignments = {
            assignment.job.project.id: assignment
            for assignment in cvat_service.get_user_assignments_in_cvat_projects(
                session,
                wallet_address=wallet_address,
                cvat_projects=[p.cvat_id for p in cvat_projects],
            )
            if assignment.status == AssignmentStatuses.created
            if not assignment.is_finished
        }

        for project in cvat_projects:
            assignment = user_assignments.get(project.id)
            results.append(
                serialize_task(
                    project.id,
                    assignment_id=assignment.id if assignment else None,
                )
            )

    return results


class UserHasUnfinishedAssignmentError(Exception):
    pass


def create_assignment(project_id: int, wallet_address: str) -> Optional[str]:
    with SessionLocal.begin() as session:
        user = get_or_404(
            cvat_service.get_user_by_id(session, wallet_address, for_update=True),
            wallet_address,
            "user",
        )

        project = cvat_service.get_project_by_id(
            session,
            project_id,
            status_in=[
                ProjectStatuses.annotation
            ],  # avoid unnecessary locking on completed projects
            for_update=True,
        )

        if not project:
            # Retry without a lock to check if the project doesn't exist
            get_or_404(
                cvat_service.get_project_by_id(session, project_id),
                project_id,
                "task",
            )
            return None

        has_active_assignments = (
            cvat_service.count_active_user_assignments(
                session, wallet_address=wallet_address, cvat_projects=[project.cvat_id]
            )
            > 0
        )
        if has_active_assignments:
            raise UserHasUnfinishedAssignmentError(
                "The user already has an unfinished assignment in this project"
            )

        unassigned_job = cvat_service.get_free_job(
            session, cvat_projects=[project.cvat_id], for_update=True
        )
        if not unassigned_job:
            return None

        assignment_id = cvat_service.create_assignment(
            session,
            wallet_address=user.wallet_address,
            cvat_job_id=unassigned_job.cvat_id,
            expires_at=utcnow()
            + timedelta(seconds=get_default_assignment_timeout(TaskTypes(project.job_type))),
        )

        with cvat_api.api_client_context(cvat_api.get_api_client()):
            cvat_api.clear_job_annotations(unassigned_job.cvat_id)
            cvat_api.restart_job(unassigned_job.cvat_id, assignee_id=user.cvat_id)

        # rollback is automatic within the transaction

    return assignment_id
