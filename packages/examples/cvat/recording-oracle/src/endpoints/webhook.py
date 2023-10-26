from typing import Union

from fastapi import APIRouter, Header, HTTPException, Request

import src.services.webhook as oracle_db_service
from src.chain.escrow import validate_escrow
from src.db import SessionLocal
from src.schemas.webhook import OracleWebhook, OracleWebhookResponse
from src.validators.signature import validate_oracle_webhook_signature

router = APIRouter()


@router.post("/oracle-webhook", description="Receives a webhook from an oracle")
async def receive_oracle_webhook(
    webhook: OracleWebhook,
    request: Request,
    human_signature: Union[str, None] = Header(default=None),
) -> OracleWebhookResponse:
    try:
        sender = await validate_oracle_webhook_signature(request, human_signature, webhook)
        validate_escrow(webhook.chain_id, webhook.escrow_address)

        with SessionLocal.begin() as session:
            webhook_id = oracle_db_service.inbox.create_webhook(
                session=session,
                escrow_address=webhook.escrow_address,
                chain_id=webhook.chain_id,
                type=sender,
                signature=human_signature,
                event_type=webhook.event_type,
                event_data=webhook.event_data,
            )

        return OracleWebhookResponse(id=webhook_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
