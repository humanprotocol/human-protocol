from contextlib import suppress
from datetime import timedelta

import src.cvat.api_calls as cvat_api
import src.services.cvat as cvat_service
from src.core.types import JobStatuses, Networks, ProjectStatuses, TaskTypes
from src.db import SessionLocal
from src.db.utils import ForUpdateParams
from src.models.cvat import Job
from src.utils.assignments import get_default_assignment_timeout
from src.utils.requests import get_or_404
from src.utils.time import utcnow


class UserHasUnfinishedAssignmentError(Exception):
    def __str__(self) -> str:
        return (
            "There are unfinished assignments in this escrow. "
            "Please complete or resign them first."
        )


def create_assignment(escrow_address: str, chain_id: Networks, wallet_address: str) -> str | None:
    with SessionLocal.begin() as session:
        user = get_or_404(
            cvat_service.get_user_by_id(session, wallet_address, for_update=True),
            wallet_address,
            object_type_name="user",
        )

        if cvat_service.has_active_user_assignments(
            session,
            wallet_address=wallet_address,
            escrow_address=escrow_address,
            chain_id=chain_id.value,
        ):
            raise UserHasUnfinishedAssignmentError(
                "The user already has an unfinished assignment in this project"
            )

        # TODO: Try to put into 1 request. SQLAlchemy generates 2 queries with simple
        # .options(selectinload(Job.project))
        project = get_or_404(
            cvat_service.get_project_by_escrow_address(
                session, escrow_address, status_in=[ProjectStatuses.annotation]
            ),
            escrow_address,
            object_type_name="job",
        )

        unassigned_job = cvat_service.get_free_job(
            session,
            escrow_address=escrow_address,
            chain_id=chain_id.value,
            user_wallet_address=wallet_address,
            for_update=ForUpdateParams(skip_locked=True),
            # lock the job to be able to make a rollback if CVAT requests fail
            # can potentially be optimized to make less DB requests
            # and rely only on assignment expiration
        )

        if not unassigned_job:
            return None

        assignment_id = cvat_service.create_assignment(
            session,
            wallet_address=user.wallet_address,
            cvat_job_id=unassigned_job.cvat_id,
            expires_at=utcnow()
            + timedelta(
                seconds=get_default_assignment_timeout(
                    TaskTypes(project.job_type)
                    # TODO: need to update this if we have multiple job types per escrow
                )
            ),
        )

        cvat_service.update_job_status(session, unassigned_job.id, status=JobStatuses.in_progress)
        cvat_service.touch(session, Job, [unassigned_job.id])

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
        assignment = get_or_404(
            next(iter(assignments), None), assignment_id, object_type_name="assignment"
        )

        # Can only resign from an active assignment in a job
        # TODO: maybe optimize to a single DB request

        if assignment.is_finished:
            raise NoAccessError  # TODO: maybe can be ignored

        if assignment.user_wallet_address != wallet_address:
            raise NoAccessError

        last_job_assignment = cvat_service.get_latest_assignment_by_cvat_job_id(
            session,
            assignment.cvat_job_id,
            for_update=ForUpdateParams(skip_locked=True),
        )
        if not last_job_assignment or assignment.id != last_job_assignment.id:
            raise NoAccessError

        cvat_service.cancel_assignment(session, assignment_id)

        # Try to update the status, but don't insist
        with suppress(cvat_api.exceptions.ApiException):
            cvat_api.update_job_assignee(assignment.cvat_job_id, assignee_id=None)

            # Update the job only if assignee was unset
            cvat_service.update_job_status(session, assignment.job.id, status=JobStatuses.new)

        cvat_service.touch(session, Job, [assignment.job.id])
