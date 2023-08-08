import hmac
from ast import literal_eval
from hashlib import sha256

from fastapi import HTTPException, Request
from src.config import CvatConfig
from src.modules.chain.escrow import get_job_launcher_address
from src.modules.chain.web3 import recover_signer


async def validate_webhook_signature(request: Request, signature: str, webhook: dict):
    data: bytes = await request.body()
    message: dict = literal_eval(data.decode("utf-8"))

    signer = recover_signer(webhook.chain_id, message, signature)

    job_launcher_address = get_job_launcher_address(
        webhook.chain_id, webhook.escrow_address
    )

    if signer.lower() != job_launcher_address.lower():
        raise ValueError(
            f"Webhook sender address doesn't match. Expected: {job_launcher_address}, received: {signer}."
        )


async def validate_cvat_signature(request: Request, x_signature_256: str):
    data: bytes = await request.body()
    signature = (
        "sha256="
        + hmac.new(
            CvatConfig.cvat_webhook_secret.encode("utf-8"), data, digestmod=sha256
        ).hexdigest()
    )

    if not hmac.compare_digest(x_signature_256, signature):
        raise HTTPException(status_code=403, detail="Signature doesn't match")
