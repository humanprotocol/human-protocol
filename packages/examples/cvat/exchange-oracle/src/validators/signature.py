import hmac
from ast import literal_eval
from hashlib import sha256
from http import HTTPStatus

from fastapi import HTTPException, Request

from src.chain.escrow import get_job_launcher_address, get_recording_oracle_address
from src.chain.web3 import recover_signer
from src.core.config import Config
from src.core.types import OracleWebhookTypes
from src.schemas.webhook import OracleWebhook


async def validate_oracle_webhook_signature(
    request: Request, signature: str, webhook: OracleWebhook
) -> OracleWebhookTypes:
    data: bytes = await request.body()
    message: dict = literal_eval(data.decode("utf-8"))

    signer = recover_signer(webhook.chain_id, message, signature)

    job_launcher_address = get_job_launcher_address(webhook.chain_id, webhook.escrow_address)
    recording_oracle_address = get_recording_oracle_address(
        webhook.chain_id, webhook.escrow_address
    )
    possible_signers = {
        OracleWebhookTypes.job_launcher: job_launcher_address,
        OracleWebhookTypes.recording_oracle: recording_oracle_address,
    }

    matched_signer = next(
        (
            s_type
            for s_type in possible_signers
            if signer.lower() == possible_signers[s_type].lower()
        ),
        None,
    )
    if not matched_signer:
        raise HTTPException(status_code=HTTPStatus.UNAUTHORIZED)

    return matched_signer


async def validate_cvat_signature(request: Request, x_signature_256: str):
    data: bytes = await request.body()
    signature = (
        "sha256="
        + hmac.new(
            Config.cvat_config.cvat_webhook_secret.encode("utf-8"),
            data,
            digestmod=sha256,
        ).hexdigest()
    )

    if not hmac.compare_digest(x_signature_256, signature):
        raise HTTPException(status_code=HTTPStatus.UNAUTHORIZED)
