from datetime import timedelta
from typing import Optional

import src.cvat.api_calls as cvat_api
import src.services.cvat as cvat_service
from src.core.types import ProjectStatuses, TaskTypes, Networks
from src.db import SessionLocal
from src.utils.assignments import get_default_assignment_timeout
from src.utils.requests import get_or_404
from src.utils.time import utcnow


class UserHasUnfinishedAssignmentError(Exception):
    pass


def create_assignment(
    escrow_address: str, chain_id: Networks, wallet_address: str
) -> Optional[str]:
    with SessionLocal.begin() as session:
        user = get_or_404(
            cvat_service.get_user_by_id(session, wallet_address, for_update=True),
            wallet_address,
            "user",
        )

        # There can be several projects with under one escrow, we need any
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
