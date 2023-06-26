from fastapi import APIRouter, HTTPException, Header
from typing import Union

from src.db import SessionLocal
from src.modules.chain.escrow import validate_escrow
from src.modules.webhook.api_schema import (
    ExchangeOracleWebhook,
    ExchangeOracleWebhookResponse,
)
from src.modules.webhook.service import create_webhook


router = APIRouter()


@router.post(
    "/exchange-oracle",
    description="Consumes a webhook from an exchange oracle",
)
def exchange_oracle_webhook(
    exchange_oracle_webhook: ExchangeOracleWebhook,
    human_signature: Union[str, None] = Header(default=None),
):
    try:
        # validate_signature(human_signature)
        validate_escrow(
            exchange_oracle_webhook.chain_id, exchange_oracle_webhook.escrow_address
        )

        with SessionLocal.begin() as session:
            webhook_id = create_webhook(
                session, exchange_oracle_webhook, human_signature
            )

        return ExchangeOracleWebhookResponse(id=webhook_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
