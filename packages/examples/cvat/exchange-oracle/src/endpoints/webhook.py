from typing import Union

from fastapi import APIRouter, Header, HTTPException, Request

import src.services.webhook as oracle_db_service
from src.core.types import OracleWebhookTypes
from src.db import SessionLocal
from src.schemas.webhook import OracleWebhook, OracleWebhookResponse
from src.utils.time import utcnow
from src.validators.signature import validate_oracle_webhook_signature

router = APIRouter()


@router.post("/oracle-webhook", description="Receives a webhook from an oracle")
async def receive_oracle_webhook(
    webhook: OracleWebhook,
    request: Request,
    human_signature: Union[str, None] = Header(default=None),
) -> OracleWebhookResponse:
    try:
        # TODO: remove mock once implemented in launcher
        if not human_signature:
            human_signature = "launcher-{}".format(utcnow().timestamp())
            sender_type = OracleWebhookTypes.job_launcher

        else:
            sender_type = await validate_oracle_webhook_signature(request, human_signature, webhook)

        with SessionLocal.begin() as session:
            webhook_id = oracle_db_service.inbox.create_webhook(
                session=session,
                escrow_address=webhook.escrow_address,
                chain_id=webhook.chain_id,
                type=sender_type,
                signature=human_signature,
                event_type=webhook.event_type,
                event_data=webhook.event_data,
            )

        return OracleWebhookResponse(id=webhook_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
