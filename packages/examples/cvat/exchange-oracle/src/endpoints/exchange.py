from contextlib import suppress
from datetime import datetime
from enum import auto
from typing import List, Optional, Sequence

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import Field
from sqlalchemy import select

import src.cvat.api_calls as cvat_api
import src.services.cvat as cvat_service
import src.services.exchange as oracle_service
from src.core.config import Config
from src.core.types import ProjectStatuses, TaskTypes
from src.db import SessionLocal
from src.db import engine as db_engine
from src.endpoints.authentication import AuthorizationData, AuthorizationParam
from src.endpoints.filtering import Filter, FilterDepends, OrderingDirection
from src.endpoints.pagination import Page, paginate
from src.endpoints.serializers import serialize_assignment, serialize_job
from src.endpoints.throttling import RateLimiter
from src.schemas.exchange import (
    AssignmentRequest,
    AssignmentResponse,
    AssignmentStatuses,
    JobResponse,
    JobStatuses,
    OracleStatsResponse,
    UserResponse,
    UserStatsResponse,
)
from src.utils.enums import BetterEnumMeta, StrEnum

router = APIRouter()


class JobsFilter(Filter):
    # Simply using Query is not enough to include parameter description in the OpenAPI schema
    # https://github.com/tiangolo/fastapi/issues/4700
    escrow_address: Optional[str] = None
    chain_id: Optional[int] = None
    job_type: Optional[TaskTypes] = Field(
        Query(default=None, json_schema_extra={"enum": list(TaskTypes.__members__.values())})
    )

    class SortingFields(StrEnum, metaclass=BetterEnumMeta):
        created_at = auto()
        chain_id = auto()
        job_type = auto()
        reward_amount = auto()

    sort: Optional[OrderingDirection] = Filter._default_sorting_direction_param()[1]
    sort_field: Optional[SortingFields] = Field(
        Query(
            default=SortingFields.created_at,
            json_schema_extra={"enum": list(SortingFields.__members__.values())},
        )
    )

    class SelectableFields(StrEnum, metaclass=BetterEnumMeta):
        job_description = auto()
        reward_amount = auto()
        reward_token = auto()
        created_at = auto()

    fields: List[SelectableFields] = Query(default_factory=list)

    class Constants(Filter.Constants):
        model = cvat_service.Project

        sorting_direction_field_name = "sort"
        sorting_field_name = "sort_field"

        selector_field_name = "fields"
        selectable_fields_enum_name = "SelectableFields"


@router.get(
    "/job",
    description="Lists available jobs",
    response_model_exclude_unset=True,  # required for field selection
    response_model_by_alias=True,  # required for pagination
)
async def list_jobs(
    filter: JobsFilter = FilterDepends(JobsFilter),
    created_after: Optional[datetime] = Query(default=None),
    updated_after: Optional[datetime] = Query(default=None),
    status: Optional[JobStatuses] = Query(
        default=None, json_schema_extra={"enum": list(JobStatuses.__members__.values())}
    ),
    token: AuthorizationData = AuthorizationParam,
) -> Page[JobResponse]:
    wallet_address = token.wallet_address

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
        query = query.filter(
            cvat_service.Project.jobs.any(
                cvat_service.Job.assignments.any(
                    cvat_service.Assignment.user_wallet_address == wallet_address
                )
            )
        )

    if status:
        match status:
            case JobStatuses.active:
                query = query.filter(
                    cvat_service.Project.status.in_(
                        [
                            cvat_service.ProjectStatuses.annotation,
                            cvat_service.ProjectStatuses.completed,
                            cvat_service.ProjectStatuses.validation,
                        ]
                    )
                )
            case JobStatuses.canceled:
                query = query.filter(
                    cvat_service.Project.status == cvat_service.ProjectStatuses.canceled
                )
            case JobStatuses.completed:
                query = query.filter(
                    cvat_service.Project.status == cvat_service.ProjectStatuses.recorded
                )
            case _:
                raise NotImplementedError(f"Unsupported status {status}")

    if created_after:
        query = query.filter(created_after < cvat_service.Project.created_at)

    if updated_after:
        query = query.filter(updated_after < cvat_service.Project.updated_at)

    query = filter.filter_(query)
    query = filter.sort_(query)

    with SessionLocal() as session:

        def _page_serializer(
            projects: Sequence[cvat_service.Project],
        ) -> Sequence[JobResponse]:
            page = [serialize_job(p, session=session) for p in projects]
            return [filter.select_fields_(p) for p in page]

        return paginate(session, query, transformer=_page_serializer)


@router.post("/register", description="Binds a CVAT user to a HUMAN App user")
async def register(token: AuthorizationData = AuthorizationParam) -> UserResponse:
    user_email = token.email
    user_wallet_address = token.wallet_address

    with SessionLocal.begin() as session:
        email_db_user = cvat_service.get_user_by_email(session, user_email, for_update=True)
        wallet_db_user = cvat_service.get_user_by_id(session, user_wallet_address, for_update=True)

        if wallet_db_user and not email_db_user and wallet_db_user.email != user_email:
            # Allow changing email for a wallet, don't allow changing wallet for a email
            # Need to clean up existing membership
            with suppress(cvat_api.exceptions.NotFoundException):
                cvat_api.remove_user_from_org(wallet_db_user.cvat_id)

        if not email_db_user:
            try:
                cvat_id = cvat_api.get_user_id(user_email)
            except cvat_api.exceptions.ApiException as e:
                if (
                    e.status == status.HTTP_400_BAD_REQUEST
                    and "The user is a member of the organization already." in e.body
                ):
                    # This error can indicate that we tried to add the user previously
                    # or he was added manually
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="User already exists",
                    )

                elif (
                    e.status == status.HTTP_400_BAD_REQUEST
                    and "Enter a valid email address." in e.body
                ):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email address"
                    )

                raise

            email_db_user = cvat_service.put_user(
                session,
                wallet_address=user_wallet_address,
                cvat_email=user_email,
                cvat_id=cvat_id,
            )

        elif email_db_user.wallet_address != user_wallet_address:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists"
            )

        return UserResponse(
            wallet_address=email_db_user.wallet_address,
            email=email_db_user.cvat_email,
        )


class AssignmentFilter(Filter):
    id: Optional[str] = Field(Query(default=None, alias="assignment_id"))

    class SortingFields(StrEnum, metaclass=BetterEnumMeta):
        chain_id = auto()
        job_type = auto()
        status = auto()
        reward_amount = auto()
        created_at = auto()
        expires_at = auto()

    sort: Optional[OrderingDirection] = Filter._default_sorting_direction_param()[1]
    sort_field: Optional[SortingFields] = Field(
        Query(
            default=SortingFields.created_at,
            json_schema_extra={"enum": list(SortingFields.__members__.values())},
        )
    )

    class Constants(Filter.Constants):
        model = cvat_service.Assignment

        sorting_direction_field_name = "sort"
        sorting_field_name = "sort_field"


@router.get(
    "/assignment",
    description="Lists assignments",
    response_model_exclude_unset=True,  # required for field selection
    response_model_by_alias=True,  # required for pagination
)
async def list_assignments(
    filter: AssignmentFilter = FilterDepends(AssignmentFilter),
    created_after: Optional[datetime] = Query(default=None),
    updated_after: Optional[datetime] = Query(default=None),
    escrow_address: Optional[str] = Query(default=None),
    chain_id: Optional[int] = Query(default=None),
    job_type: Optional[TaskTypes] = Query(
        default=None, json_schema_extra={"enum": list(TaskTypes.__members__.values())}
    ),
    status: Optional[AssignmentStatuses] = Query(
        default=None,
        json_schema_extra={"enum": list(AssignmentStatuses.__members__.values())},
    ),
    token: AuthorizationData = AuthorizationParam,
) -> Page[AssignmentResponse]:
    query = select(cvat_service.Assignment)

    query = query.where(cvat_service.Assignment.user_wallet_address == token.wallet_address)

    if escrow_address or chain_id:
        query = query.filter(
            cvat_service.Assignment.job.has(
                cvat_service.Job.project.has(
                    *[cvat_service.Project.escrow_address == escrow_address]
                    if escrow_address
                    else [],
                    *[cvat_service.Project.chain_id == chain_id] if chain_id else [],
                )
            )
        )

    if job_type:
        query = query.filter(
            cvat_service.Assignment.job.has(
                cvat_service.Job.project.has(cvat_service.Project.job_type == job_type)
            )
        )

    if status:
        assignment_status_mapping = {
            AssignmentStatuses.active: cvat_service.AssignmentStatuses.created,
            AssignmentStatuses.completed: cvat_service.AssignmentStatuses.completed,
            AssignmentStatuses.expired: cvat_service.AssignmentStatuses.expired,
            AssignmentStatuses.rejected: cvat_service.AssignmentStatuses.rejected,
            AssignmentStatuses.canceled: cvat_service.AssignmentStatuses.canceled,
        }
        if status == AssignmentStatuses.validation:
            query = query.filter(
                cvat_service.Assignment.status == cvat_service.AssignmentStatuses.completed,
                cvat_service.Assignment.job.has(
                    cvat_service.Job.project.has(
                        cvat_service.Project.status.in_(
                            [
                                cvat_service.ProjectStatuses.annotation,
                                cvat_service.ProjectStatuses.validation,
                            ]
                        )
                    )
                ),
            )
        elif status in assignment_status_mapping:
            query = query.filter(
                cvat_service.Assignment.status == assignment_status_mapping[status]
            )
        else:
            raise NotImplementedError(f"Unsupported status {status}")

    if created_after:
        query = query.filter(created_after < cvat_service.Assignment.created_at)

    if updated_after:
        query = query.filter(
            (updated_after < cvat_service.Assignment.completed_at)
            | (updated_after < cvat_service.Assignment.created_at)
        )

    query = filter.filter_(query)
    query = filter.sort_(query)

    with SessionLocal.begin() as session:

        def _page_serializer(
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

        return paginate(session, query, transformer=_page_serializer)


@router.post(
    "/assignment",
    description="Start an assignment within the task for the annotator",
)
async def create_assignment(
    data: AssignmentRequest, token: AuthorizationData = AuthorizationParam
) -> AssignmentResponse:
    try:
        assignment_id = oracle_service.create_assignment(
            escrow_address=data.escrow_address,
            chain_id=data.chain_id,
            wallet_address=token.wallet_address,
        )
    except oracle_service.UserHasUnfinishedAssignmentError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e

    if not assignment_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No assignments available",
        )

    return serialize_assignment(assignment_id)


@router.post(
    "/assignment/resign",
    description="Allows to reject an assignment",
)
async def resign_assignment(
    assignment_id: int, token: AuthorizationData = AuthorizationParam
) -> None:
    try:
        await oracle_service.resign_assignment(assignment_id, wallet_address=token.wallet_address)
    except oracle_service.NoAccessError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST)


@router.get("/stats/assignment", description="Get oracle statistics for the user")
async def get_user_stats(token: AuthorizationData = AuthorizationParam) -> UserStatsResponse:
    wallet_address = token.wallet_address

    with SessionLocal.begin() as session:
        stats = {}

        stats["assignments_amount"] = (
            session.query(cvat_service.Assignment.id)
            .where(cvat_service.Assignment.user_wallet_address == wallet_address)
            .count()
        )

        stats["submissions_sent"] = (
            session.query(cvat_service.Assignment.id)
            .where(
                cvat_service.Assignment.user_wallet_address == wallet_address,
                cvat_service.Assignment.status.in_(
                    [
                        cvat_service.AssignmentStatuses.completed,
                        cvat_service.AssignmentStatuses.rejected,
                    ]
                ),
            )
            .count()
        )

        stats["assignments_completed"] = (
            session.query(cvat_service.Assignment.id)
            .where(
                cvat_service.Assignment.user_wallet_address == wallet_address,
                cvat_service.Assignment.status == cvat_service.AssignmentStatuses.completed,
            )
            .count()
        )

        stats["assignments_rejected"] = (
            session.query(cvat_service.Assignment.id)
            .where(
                cvat_service.Assignment.user_wallet_address == wallet_address,
                cvat_service.Assignment.status == cvat_service.AssignmentStatuses.rejected,
            )
            .count()
        )

        stats["assignments_expired"] = (
            session.query(cvat_service.Assignment.id)
            .where(
                cvat_service.Assignment.user_wallet_address == wallet_address,
                cvat_service.Assignment.status == cvat_service.AssignmentStatuses.expired,
            )
            .count()
        )

        return UserStatsResponse(**stats)


@router.get(
    "/stats",
    description="Get oracle statistics",
    dependencies=[Depends(RateLimiter(seconds=1, times=Config.api_config.stats_rps_limit))],
)
async def get_stats() -> OracleStatsResponse:
    with SessionLocal.begin() as session:
        stats = {}

        stats["escrows_processed"] = (
            session.query(cvat_service.Project.escrow_address).distinct().count()
        )

        stats["escrows_active"] = (
            session.query(cvat_service.Project.escrow_address)
            .distinct()
            .where(
                cvat_service.Project.status.in_(
                    [ProjectStatuses.annotation, ProjectStatuses.validation]
                )
            )
            .count()
        )

        stats["escrows_cancelled"] = (
            session.query(cvat_service.Project.escrow_address)
            .distinct()
            .where(cvat_service.Project.status == ProjectStatuses.canceled)
            .count()
        )

        stats["workers_amount"] = session.query(cvat_service.User.wallet_address).count()

        stats["assignments_completed"] = (
            session.query(cvat_service.Assignment.id)
            .where(cvat_service.Assignment.status == cvat_service.AssignmentStatuses.completed)
            .count()
        )

        stats["assignments_rejected"] = (
            session.query(cvat_service.Assignment.id)
            .where(cvat_service.Assignment.status == cvat_service.AssignmentStatuses.rejected)
            .count()
        )

        stats["assignments_expired"] = (
            session.query(cvat_service.Assignment.id)
            .where(cvat_service.Assignment.status == cvat_service.AssignmentStatuses.expired)
            .count()
        )

        return OracleStatsResponse(**stats)
