from typing import Union
from fastapi import APIRouter, Header
from web3 import Web3
from src.db import SessionLocal

from src.utils.helpers import get_web3
from src.utils.escrow import check_escrow

from .service import create_webhook
from .api_schema import JLWebhook, JLWebhookResponse

router = APIRouter()


@router.post(
    "/job-launcher",
    description="Consumes a webhook from a job launcher",
)
def save_webhook(
    jl_webhook: JLWebhook,
    human_signature: Union[str, None] = Header(default=None),
):
    check_escrow(
        get_web3(jl_webhook.network), Web3.toChecksumAddress(jl_webhook.escrow_address)
    )

    with SessionLocal.begin() as session:
        webhook_id = create_webhook(session, jl_webhook, human_signature)

    return JLWebhookResponse(id=webhook_id)
