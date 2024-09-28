from datetime import timedelta

import src.cvat.api_calls as cvat_api
import src.services.cvat as cvat_service
from src.core.types import Networks, ProjectStatuses, TaskTypes
from src.db import SessionLocal
from src.utils.assignments import get_default_assignment_timeout
from src.utils.requests import get_or_404
from src.utils.time import utcnow


class UserHasUnfinishedAssignmentError(Exception):
    pass


def create_assignment(escrow_address: str, chain_id: Networks, wallet_address: str) -> str | None:  # noqa: ARG001 (don't we want to use chain_id for filter?)
    with SessionLocal.begin() as session:
        user = get_or_404(
            cvat_service.get_user_by_id(session, wallet_address, for_update=True),
            wallet_address,
            "user",
        )

        # There can be several projects under one escrow, we need any
        project = cvat_service.get_project_by_escrow_address(
            session,
            escrow_address,
            status_in=[
                ProjectStatuses.annotation
            ],  # avoid unnecessary locking on completed projects
            for_update=True,
        )

        if not project:
            # Retry without a lock to check if the project doesn't exist
            get_or_404(
                cvat_service.get_project_by_escrow_address(
                    session, escrow_address, status_in=[ProjectStatuses.annotation]
                ),
                escrow_address,
                "job",
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
            session,
            cvat_projects=[project.cvat_id],
            user_wallet_address=wallet_address,
            for_update=True,
        )
        if not unassigned_job:
            return None

        cvat_service.get_task_by_id(
            session, unassigned_job.task.id, for_update=True
        )  # lock the row

        assignment_id = cvat_service.create_assignment(
            session,
            wallet_address=user.wallet_address,
            cvat_job_id=unassigned_job.cvat_id,
            expires_at=utcnow()
            + timedelta(seconds=get_default_assignment_timeout(TaskTypes(project.job_type))),
        )

        unassigned_job.touch(session)  # project|task|job rows are locked for update

        with cvat_api.api_client_context(cvat_api.get_api_client()):
            cvat_api.clear_job_annotations(unassigned_job.cvat_id)
            cvat_api.restart_job(unassigned_job.cvat_id, assignee_id=user.cvat_id)

        # rollback is automatic within the transaction

    return assignment_id


class NoAccessError(Exception):
    pass


async def resign_assignment(assignment_id: str, wallet_address: str) -> None:
    with SessionLocal.begin() as session:
        assignments = cvat_service.get_assignments_by_id(session, [assignment_id], for_update=True)
        assignment = get_or_404(next(iter(assignments), None), assignment_id, "assignment")

        # Can only resign from an active assignment in a job
        # TODO: maybe optimize to a single DB request

        if assignment.is_finished:
            raise NoAccessError  # TODO: maybe can be ignored

        if assignment.user_wallet_address != wallet_address:
            raise NoAccessError

        last_job_assignment = cvat_service.get_latest_assignment_by_cvat_job_id(
            session, assignment.cvat_job_id, for_update=True
        )
        if assignment.id != last_job_assignment.id:
            raise NoAccessError

        cvat_service.cancel_assignment(session, assignment_id)

        job = assignment.job
        task = job.task
        project = task.project
        cvat_service.get_job_by_id(session, job.id, for_update=True)  # lock the row
        cvat_service.get_task_by_id(session, task.id, for_update=True)  # lock the row
        cvat_service.get_project_by_id(session, project.id, for_update=True)  # lock the row

        assignment.job.touch(session)  # project|task rows are locked for update
