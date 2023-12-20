from http import HTTPStatus
from random import choices, shuffle
from string import ascii_letters, punctuation
from typing import List
from uuid import uuid4

from doccano_client.exceptions import DoccanoAPIError
from fastapi import APIRouter, HTTPException, Header
from human_protocol_sdk.escrow import EscrowUtils, EscrowClientError
from sqlalchemy.exc import IntegrityError, NoResultFound
from starlette.requests import Request

from src.annotation import (
    UserRegistrationInfo,
    create_user,
    JobApplication,
    register_annotator,
)
from src.chain import (
    EscrowInfo,
    validate_escrow,
    validate_job_launcher_signature,
    validate_human_app_signature,
    EventType,
)
from src.config import Config
from src.db import (
    Session,
    JobRequest,
    Statuses,
    Worker,
    AnnotationProject,
    stage_success,
)

logger = Config.logging.get_logger()
router = APIRouter()


class Endpoints:
    JOB_REQUEST = "/webhook"
    JOB_LIST = "/jobs"
    JOB_APPLY = "/job/apply"
    USER_REGISTER = "/user/register"


class Errors:
    ADDRESS_INVALID = HTTPException(
        status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
        detail="Address is not a valid address.",
    )
    ESCROW_INFO_INVALID = HTTPException(
        status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
        detail="Escrow info contains invalid information.",
    )
    ESCROW_NOT_FOUND = HTTPException(
        status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
        detail="No escrow found under given address.",
    )
    ESCROW_VALIDATION_FAILED = HTTPException(
        status_code=HTTPStatus.UNPROCESSABLE_ENTITY, detail="Escrow invalid."
    )
    JOB_OR_WORKER_MISSING = HTTPException(
        status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
        detail="Could not register worker for job.",
    )
    JOB_UNAVAILABLE = HTTPException(
        status_code=HTTPStatus.UNPROCESSABLE_ENTITY, detail="Job is not available."
    )
    TASKS_UNAVAILABLE = HTTPException(
        status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
        detail="No tasks available for worker.",
    )
    WORKER_ASSIGNMENT_FAILED = HTTPException(
        status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
        detail="Could not assign tasks to worker.",
    )
    WORKER_ALREADY_REGISTERED = HTTPException(
        status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
        detail="Worker could not be registered. Wallet address already registered.",
    )
    WORKER_CREATION_FAILED = HTTPException(
        status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
        detail="Worker could not be registered. A user with the given username might already exist.",
    )
    WORKER_NOT_VALIDATED = HTTPException(
        status_code=HTTPStatus.UNPROCESSABLE_ENTITY, detail="Worker is not validated."
    )
    WORKER_VALIDATION_FAILED = HTTPException(
        status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
        detail="Worker could not be verified.",
    )
    SIGNATURE_INVALID = HTTPException(status_code=HTTPStatus.UNAUTHORIZED)
    REQUEST_FAILED = HTTPException(status_code=HTTPStatus.INTERNAL_SERVER_ERROR)


@router.post(Endpoints.JOB_REQUEST)
async def register_job_request(
    escrow_info: EscrowInfo,
    request: Request,
    signature: str = Header(description="Calling service signature"),
):
    """Adds a job request to the database, to be processed later."""
    # validate escrow info
    logger.info(f"POST {Endpoints.JOB_REQUEST} called with {escrow_info}.")
    try:
        escrow = EscrowUtils.get_escrow(
            escrow_info.chain_id, escrow_info.escrow_address.lower()
        )
    except EscrowClientError:
        logger.exception(Errors.ESCROW_INFO_INVALID.detail + f" {escrow_info}")
        raise Errors.ESCROW_INFO_INVALID

    if escrow is None:
        logger.error(Errors.ESCROW_NOT_FOUND.detail + f" {escrow_info}")
        raise Errors.ESCROW_NOT_FOUND

    try:
        validate_escrow(escrow)
    except ValueError:
        logger.exception(Errors.ESCROW_VALIDATION_FAILED.detail + f" {escrow}")
        raise Errors.ESCROW_VALIDATION_FAILED

    signature_valid = await validate_job_launcher_signature(
        escrow_info, request, signature, escrow
    )
    if not signature_valid:
        logger.error(f"Signature invalid for {escrow_info} with signature {signature}")
        raise Errors.SIGNATURE_INVALID

    match escrow_info.event_type:
        # add new job
        case EventType.ESCROW_CREATED:
            with Session() as session:
                id = str(uuid4())
                job_request = JobRequest(
                    id=id,
                    escrow_address=escrow_info.escrow_address,
                    chain_id=escrow_info.chain_id,
                )
                session.add(job_request)
                session.commit()
                logger.info(f"Successfully added new job. Id: {id}")
        # initiate job completion
        case EventType.ESCROW_CANCELED:
            with Session() as session:
                job_request = (
                    session.query(JobRequest)
                    .where(
                        (JobRequest.escrow_address == escrow_info.escrow_address)
                        & (JobRequest.chain_id == escrow_info.chain_id)
                    )
                    .one()
                )
                job_request.status = Statuses.completed
                job_request.attempts = 0
                id = job_request.id
                session.commit()
            logger.info(f"Job {id} cancelled. Initiated job completion")


@router.get(Endpoints.JOB_LIST)
async def list_available_jobs(
    chainId: int,
    signature: str = Header(description="Calling service signature"),
):
    """Lists available jobs."""
    logger.debug(f"GET {Endpoints.JOB_LIST}?chainId={chainId} called.")

    if not validate_human_app_signature(signature):
        logger.exception("Invalid signature.")
        raise Errors.SIGNATURE_INVALID

    with Session() as session:
        return [
            {"jobId": job.id, "jobType": job.type}
            for job in session.query(JobRequest)
            .where(
                (JobRequest.status == Statuses.in_progress.value)
                & (JobRequest.chain_id == chainId)
            )
            .all()
        ]


@router.post(Endpoints.USER_REGISTER)
async def register_worker(
    user_info: UserRegistrationInfo,
    signature: str = Header(description="Calling service signature"),
):
    """Registers a new user with the given wallet address."""
    logger.info(f"POST {Endpoints.USER_REGISTER} called with {user_info}.")

    if not validate_human_app_signature(signature):
        logger.exception("Invalid signature.")
        raise Errors.SIGNATURE_INVALID

    if not await validate_worker(user_info.worker_address):
        logger.exception(Errors.WORKER_VALIDATION_FAILED.detail + f" {user_info}")
        raise Errors.WORKER_VALIDATION_FAILED

    with Session() as session:
        # check if wallet is already registered
        if (
            session.query(Worker)
            .where(Worker.id == user_info.worker_address)
            .one_or_none()
            is not None
        ):
            logger.error(Errors.WORKER_ALREADY_REGISTERED.detail + f" {user_info}")
            raise Errors.WORKER_ALREADY_REGISTERED

        try:
            password = "".join(choices(ascii_letters + punctuation, k=16))
            worker = Worker(
                id=user_info.worker_address,
                password=password,
                is_validated=True,
                username=user_info.name,
            )
            create_user(user_info.name, worker.password)
            session.add(worker)
            session.commit()
        except DoccanoAPIError:
            session.rollback()
            logger.exception(Errors.WORKER_CREATION_FAILED.detail + f" {user_info}")
            raise Errors.WORKER_CREATION_FAILED
        except IntegrityError:
            session.rollback()
            logger.exception(Errors.WORKER_CREATION_FAILED.detail + f" {user_info}")
            raise Errors.WORKER_CREATION_FAILED

    logger.info(f"Successfully registered worker {user_info}")
    return {"username": user_info.name, "password": password}


@router.post(Endpoints.JOB_APPLY)
async def apply_for_job(
    job_application: JobApplication,
    signature: str = Header(description="Calling service signature"),
):
    """Applies the given worker for the job. Registers and validates them if necessary"""
    logger.info(f"POST {Endpoints.JOB_APPLY} called with {job_application}.")

    worker_id = job_application.worker_id
    job_id = job_application.job_id

    if not validate_human_app_signature(signature):
        logger.error(f"Invalid signature: {signature}")
        raise Errors.SIGNATURE_INVALID

    with Session() as session:
        # get worker and job, make sure they exist
        try:
            worker: Worker = session.query(Worker).where(Worker.id == worker_id).one()
            job: JobRequest = (
                session.query(JobRequest).where(JobRequest.id == job_id).one()
            )
        except NoResultFound:
            logger.exception(
                Errors.JOB_OR_WORKER_MISSING.detail + f" {job_application}"
            )
            raise Errors.JOB_OR_WORKER_MISSING

        if not worker.is_validated:
            logger.error(
                Errors.WORKER_NOT_VALIDATED.detail + f" {job_application.worker_id}"
            )
            raise Errors.WORKER_NOT_VALIDATED

        if job.status != Statuses.in_progress:
            logger.error(
                Errors.JOB_UNAVAILABLE.detail
                + f" {job_application.job_id}. Wrong status: {job.status}"
            )
            raise Errors.JOB_UNAVAILABLE

        # get project to assign worker to
        logger.debug("Fetching annotation projects to assign worker to.")
        projects: List[AnnotationProject] = [
            project
            for project in job.projects
            if project.status == Statuses.pending.value
        ]
        if len(projects) == 0:
            logger.error(Errors.TASKS_UNAVAILABLE.detail + f" {job.id}")
            raise Errors.TASKS_UNAVAILABLE

        shuffle(projects)
        project = projects[0]

        try:
            logger.debug(f"Registering {worker.username} for project {project.id}")
            register_annotator(worker.username, project.id)
            project.worker = worker
        except Exception:
            logger.exception(
                Errors.WORKER_ASSIGNMENT_FAILED.detail
                + f" worker: {worker.username}, project: {project.id}"
            )
            raise Errors.WORKER_ASSIGNMENT_FAILED

        logger.info(f"Successfully assigned worker {worker.id} to project {project.id}")
        session.commit()

        return {
            "username": worker.username,
            "password": worker.password,
            "project_name": project.name,
            "url": Config.doccano.url(),
        }


async def validate_worker(worker_id: str):
    """Validates the given worker_id with the Reputation Oracle.

    Notes:
        - Currently, this just returns True, as there is no validation mechanism in place in the Reputation Oracle.
    """
    return True
