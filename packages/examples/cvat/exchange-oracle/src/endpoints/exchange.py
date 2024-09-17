from contextlib import suppress
from http import HTTPStatus

from fastapi import APIRouter, Header, HTTPException, Path, Query

import src.cvat.api_calls as cvat_api
import src.services.cvat as cvat_service
import src.services.exchange as oracle_service
from src.db import SessionLocal
from src.schemas.exchange import AssignmentRequest, TaskResponse, UserRequest, UserResponse
from src.validators.signature import validate_human_app_signature

router = APIRouter()


@router.get("/tasks", description="Lists available tasks")
async def list_tasks(
    wallet_address: str | None = Query(default=None),
    signature: str = Header(description="Calling service signature"),
) -> list[TaskResponse]:
    await validate_human_app_signature(signature)

    if not wallet_address:
        return oracle_service.get_available_tasks()
    else:
        return oracle_service.get_tasks_by_assignee(wallet_address=wallet_address)


@router.put("/register", description="Binds a CVAT user a to HUMAN App user")
async def register(
    user: UserRequest,
    signature: str = Header(description="Calling service signature"),
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
                    # NOTE: CVAT < v2.8.0 compatibility
                    e.status == HTTPStatus.BAD_REQUEST
                    and "It is not a valid email in the system." in e.body
                ):
                    raise HTTPException(
                        status_code=HTTPStatus.NOT_FOUND, detail="User with this email not found"
                    ) from e

                if (
                    e.status == HTTPStatus.BAD_REQUEST
                    and "The user is a member of the organization already." in e.body
                ):
                    # This error can indicate that we tried to add the user previously
                    # or he was added manually
                    raise HTTPException(
                        status_code=HTTPStatus.INTERNAL_SERVER_ERROR, detail="User already exists"
                    )

                if e.status == HTTPStatus.BAD_REQUEST and "Enter a valid email address." in e.body:
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


@router.post(
    "/tasks/{id}/assignment",
    description="Start an assignment within the task for the annotator",
)
async def create_assignment(
    data: AssignmentRequest,
    project_id: str = Path(alias="id"),
    signature: str = Header(description="Calling service signature"),
) -> TaskResponse:
    await validate_human_app_signature(signature)

    try:
        assignment_id = oracle_service.create_assignment(
            project_id=project_id, wallet_address=data.wallet_address
        )
    except oracle_service.UserHasUnfinishedAssignmentError as e:
        raise HTTPException(status_code=HTTPStatus.BAD_REQUEST, detail=str(e)) from e

    if not assignment_id:
        raise HTTPException(
            status_code=HTTPStatus.BAD_REQUEST,
            detail="No assignments available for this wallet address.",
        )

    return oracle_service.serialize_task(project_id, assignment_id=assignment_id)
