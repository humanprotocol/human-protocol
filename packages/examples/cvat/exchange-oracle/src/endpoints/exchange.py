from contextlib import suppress
from enum import auto
from http import HTTPStatus
from typing import Optional, Sequence

from fastapi import APIRouter, Header, HTTPException, Query
from sqlalchemy import select

import src.cvat.api_calls as cvat_api
import src.services.cvat as cvat_service
import src.services.exchange as oracle_service
from src.core.types import ProjectStatuses, TaskTypes
from src.db import SessionLocal
from src.db import engine as db_engine
from src.endpoints.filtering import Filter, FilterDepends, OrderingDirection
from src.endpoints.pagination import Page, paginate
from src.endpoints.serializers import serialize_assignment, serialize_job
from src.schemas.exchange import (
    AssignmentRequest,
    AssignmentResponse,
    JobResponse,
    UserRequest,
    UserResponse,
)
from src.utils.enums import BetterEnumMeta, StrEnum
from src.validators.signature import validate_human_app_signature

router = APIRouter()


class JobsFilter(Filter):
    escrow_address: Optional[str] = None
    job_type: Optional[TaskTypes] = None

    class SortingFields(StrEnum, metaclass=BetterEnumMeta):
        created_at = auto()
        chain_id = auto()
        job_type = auto()
        reward_amount = auto()

    sort: Optional[OrderingDirection] = Filter._default_sorting_direction_param()[1]
    sort_field: Optional[SortingFields] = Query(default=SortingFields.created_at)

    class Constants(Filter.Constants):
        model = cvat_service.Project

        sorting_direction_field_name = "sort"
        sorting_field_name = "sort_field"


@router.get("/job", description="Lists available jobs")
async def list_jobs(
    wallet_address: Optional[str] = Query(default=None),
    signature: str = Header(description="Calling service signature", alias="Human-Signature"),
    filter: JobsFilter = FilterDepends(JobsFilter),
) -> Page[JobResponse]:
    await validate_human_app_signature(signature)

    query = select(cvat_service.Project)

    # We need only high-level jobs (i.e. escrows) without project details
    if db_engine.driver == "psycopg2":
        subquery = select(cvat_service.Project.id).distinct(
            cvat_service.Project.escrow_address
            # DISTINCT ON is a postgres feature
        )
        query = query.where(cvat_service.Project.id.in_(subquery))
    else:
        # should be something like
        # select(Project).where(id.in_(select(Project.id).group_by(Project.escrow_address)))
        raise NotImplementedError(f"DB engine {db_engine.driver} not supported in this operation")

    if wallet_address:
        query = query.where(
            cvat_service.Project.jobs.any(
                cvat_service.Job.assignments.any(
                    cvat_service.Assignment.user_wallet_address == wallet_address
                )
            )
        )

    query = filter.filter_(query)
    query = filter.sort_(query)

    with SessionLocal() as session:

        def _response_transformer(
            projects: Sequence[cvat_service.Project],
        ) -> Sequence[JobResponse]:
            return [serialize_job(p, session=session) for p in projects]

        return paginate(session, query, transformer=_response_transformer)


@router.put("/register", description="Binds a CVAT user to a HUMAN App user")
async def register(
    user: UserRequest,
    signature: str = Header(description="Calling service signature", alias="Human-Signature"),
) -> UserResponse:
    await validate_human_app_signature(signature)

    with SessionLocal.begin() as session:
        email_db_user = cvat_service.get_user_by_email(session, user.cvat_email, for_update=True)
        wallet_db_user = cvat_service.get_user_by_id(session, user.wallet_address, for_update=True)

        if wallet_db_user and not email_db_user and wallet_db_user.cvat_email != user.cvat_email:
            # Allow changing email for a wallet, don't allow changing wallet for a email
            # Need to clean up existing membership
            with suppress(cvat_api.exceptions.NotFoundException):
                cvat_api.remove_user_from_org(wallet_db_user.cvat_id)

        if not email_db_user:
            try:
                cvat_id = cvat_api.get_user_id(user.cvat_email)
            except cvat_api.exceptions.ApiException as e:
                if (
                    e.status == HTTPStatus.BAD_REQUEST
                    and "The user is a member of the organization already." in e.body
                ):
                    # This error can indicate that we tried to add the user previously
                    # or he was added manually
                    raise HTTPException(
                        status_code=HTTPStatus.INTERNAL_SERVER_ERROR, detail="User already exists"
                    )

                elif (
                    e.status == HTTPStatus.BAD_REQUEST and "Enter a valid email address." in e.body
                ):
                    raise HTTPException(
                        status_code=HTTPStatus.BAD_REQUEST, detail="Invalid email address"
                    )

                raise

            email_db_user = cvat_service.put_user(
                session,
                wallet_address=user.wallet_address,
                cvat_email=user.cvat_email,
                cvat_id=cvat_id,
            )

        elif email_db_user.wallet_address != user.wallet_address:
            raise HTTPException(status_code=HTTPStatus.BAD_REQUEST, detail="User already exists")

        return UserResponse(
            wallet_address=email_db_user.wallet_address,
            cvat_email=email_db_user.cvat_email,
            cvat_id=email_db_user.cvat_id,
        )


class AssignmentFilter(Filter):
    user_wallet_address: Optional[str] = Query(default=None, alias="wallet_address")
    id: Optional[str] = None
    status: Optional[ProjectStatuses] = None

    class SortingFields(StrEnum, metaclass=BetterEnumMeta):
        chain_id = auto()
        job_type = auto()
        status = auto()
        reward_amount = auto()
        created_at = auto()
        expires_at = auto()

    sort: Optional[OrderingDirection] = Filter._default_sorting_direction_param()[1]
    sort_field: Optional[SortingFields] = Query(default=SortingFields.created_at)

    class Constants(Filter.Constants):
        model = cvat_service.Assignment

        sorting_direction_field_name = "sort"
        sorting_field_name = "sort_field"


@router.get("/assignment", description="Lists assignments")
async def list_assignments(
    signature: str = Header(description="Calling service signature", alias="Human-Signature"),
    filter: AssignmentFilter = FilterDepends(AssignmentFilter),
    escrow_address: Optional[str] = Query(default=None),
    job_type: Optional[TaskTypes] = Query(default=None),
) -> Page[AssignmentResponse]:
    await validate_human_app_signature(signature)

    query = select(cvat_service.Assignment)

    if escrow_address:
        query = query.filter(
            cvat_service.Assignment.job.has(
                cvat_service.Job.project.has(cvat_service.Project.escrow_address == escrow_address)
            )
        )

    if job_type:
        query = query.filter(
            cvat_service.Assignment.job.has(
                cvat_service.Job.project.has(cvat_service.Project.job_type == job_type)
            )
        )

    query = filter.filter_(query)
    query = filter.sort_(query)

    with SessionLocal.begin() as session:

        def _response_transformer(
            assignments: Sequence[cvat_service.Assignment],
        ) -> Sequence[AssignmentResponse]:
            results = []

            jobs_for_assignments = {
                job.cvat_id: job
                for job in cvat_service.get_jobs_by_cvat_id(
                    session, [a.cvat_job_id for a in assignments]
                )
            }

            projects_for_assignments = {
                project.cvat_id: project
                for project in cvat_service.get_projects_by_cvat_ids(
                    session,
                    set(job.cvat_project_id for job in jobs_for_assignments.values()),
                    limit=len(jobs_for_assignments),
                )
            }

            for assignment in assignments:
                job = jobs_for_assignments[assignment.cvat_job_id]
                project = projects_for_assignments[job.cvat_project_id]
                results.append(serialize_assignment(assignment, session=session, project=project))

            return results

        return paginate(session, query, transformer=_response_transformer)


@router.post(
    "/assignment",
    description="Start an assignment within the task for the annotator",
)
async def create_assignment(
    data: AssignmentRequest,
    signature: str = Header(description="Calling service signature", alias="Human-Signature"),
) -> AssignmentResponse:
    await validate_human_app_signature(signature)

    try:
        assignment_id = oracle_service.create_assignment(
            escrow_address=data.escrow_address,
            chain_id=data.chain_id,
            wallet_address=data.wallet_address,
        )
    except oracle_service.UserHasUnfinishedAssignmentError as e:
        raise HTTPException(status_code=HTTPStatus.BAD_REQUEST, detail=str(e)) from e

    if not assignment_id:
        raise HTTPException(
            status_code=HTTPStatus.BAD_REQUEST,
            detail="No assignments available",
        )

    return serialize_assignment(assignment_id)
