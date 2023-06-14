import hmac
from hashlib import sha256
from fastapi import HTTPException, Request

from src.config import CvatConfig


# TODO: Validate webhook signature
def validate_signature(signature: str):
    pass


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
