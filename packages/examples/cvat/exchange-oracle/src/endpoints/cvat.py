from typing import Annotated

from fastapi import APIRouter, Header, Request

from src.handlers.cvat_events import cvat_webhook_handler
from src.schemas.cvat import CvatWebhook
from src.validators.signature import validate_cvat_signature

router = APIRouter()


@router.post("/cvat-webhook", description="Receives a webhook from CVAT")
async def receive_cvat_webhook(
    cvat_webhook: CvatWebhook,
    request: Request,
    x_signature_256: Annotated[str, Header()],
):
    await validate_cvat_signature(request, x_signature_256)
    cvat_webhook_handler(cvat_webhook)
