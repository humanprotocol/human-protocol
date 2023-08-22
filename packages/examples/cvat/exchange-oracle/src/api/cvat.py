from fastapi import APIRouter, Header, Request
from src.handlers.webhook import cvat_webhook_handler
from src.schemas.cvat import CvatWebhook
from src.validators.signature import validate_cvat_signature

router = APIRouter()


@router.post(
    "/cvat",
    description="Consumes a webhook from a cvat",
)
async def cvat_webhook(
    cvat_webhook: CvatWebhook,
    request: Request,
    x_signature_256: str = Header(),
):
    await validate_cvat_signature(request, x_signature_256)
    cvat_webhook_handler(cvat_webhook)
