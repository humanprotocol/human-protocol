from ast import literal_eval
from http import HTTPStatus

from fastapi import HTTPException, Request

from src.chain.escrow import get_exchange_oracle_address
from src.chain.web3 import recover_signer
from src.core.types import OracleWebhookTypes
from src.schemas.webhook import OracleWebhook


async def validate_oracle_webhook_signature(
    request: Request, signature: str, webhook: OracleWebhook
) -> OracleWebhookTypes:
    data: bytes = await request.body()
    message: dict = literal_eval(data.decode("utf-8"))

    signer = recover_signer(webhook.chain_id, message, signature)

    exchange_oracle_address = get_exchange_oracle_address(webhook.chain_id, webhook.escrow_address)
    possible_signers = {
        OracleWebhookTypes.exchange_oracle: exchange_oracle_address,
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
