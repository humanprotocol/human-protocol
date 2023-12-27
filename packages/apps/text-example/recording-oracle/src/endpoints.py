from http import HTTPStatus
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Header
from human_protocol_sdk.escrow import EscrowUtils, EscrowClientError
from starlette.requests import Request

from src.chain import EscrowInfo, validate_escrow, validate_exchange_oracle_signature
from src.config import Config
from src.db import Session, ResultsProcessingRequest

logger = Config.logging.get_logger()
router = APIRouter()


class Endpoints:
    WEBHOOK = "/webhook"


class Errors:
    AUTH_SIGNATURE_INVALID = HTTPException(status_code=HTTPStatus.UNAUTHORIZED)
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
    INVALID_REQUEST = HTTPException(status_code=HTTPStatus.BAD_REQUEST)
    INVALID_TOKEN = HTTPException(status_code=HTTPStatus.UNAUTHORIZED)


class Webhook(EscrowInfo):
    solution_url: str


@router.post(Endpoints.WEBHOOK)
async def register_raw_results(
    webhook: Webhook,
    request: Request,
    human_signature: str = Header(),
):
    """Adds a pending raw results processing request to the database, to be processed later."""
    logger.info(f"POST {Endpoints.WEBHOOK} called with {webhook}.")

    # run validations
    try:
        escrow = EscrowUtils.get_escrow(
            webhook.chain_id, webhook.escrow_address.lower()
        )
    except EscrowClientError:
        logger.exception(Errors.ESCROW_INFO_INVALID.detail + f" {webhook}")
        raise Errors.ESCROW_INFO_INVALID

    if escrow is None:
        logger.error(Errors.ESCROW_NOT_FOUND.detail + f" {webhook}")
        raise Errors.ESCROW_NOT_FOUND

    try:
        validate_escrow(escrow)
    except ValueError:
        logger.exception(Errors.ESCROW_VALIDATION_FAILED.detail + f" {escrow}")
        raise Errors.ESCROW_VALIDATION_FAILED

    signature_valid = await validate_exchange_oracle_signature(
        webhook, request, human_signature, escrow
    )
    if not signature_valid:
        logger.error(
            f"Signature invalid for {webhook} with signature {human_signature}"
        )
        raise Errors.AUTH_SIGNATURE_INVALID

    # register request
    with Session() as session:
        id = str(uuid4())
        request = ResultsProcessingRequest(
            id=id,
            escrow_address=webhook.escrow_address,
            chain_id=webhook.chain_id,
            solution_url=webhook.solution_url,
        )
        session.add(request)
        session.commit()
        logger.info(f"Successfully added new request. Id: {id}")
