from ast import literal_eval
from fastapi import Request

from src.modules.chain.kvstore import get_role_by_address
from src.modules.chain.web3 import recover_signer


async def validate_webhook_signature(
    request: Request, human_signature: str, webhook: dict
):
    data: bytes = await request.body()
    message: dict = literal_eval(data.decode("utf-8"))

    signer = recover_signer(webhook.chain_id, message, human_signature)

    role = get_role_by_address(webhook.chain_id, signer)

    if not role == "exchange_oracle":
        raise ValueError(
            f"Webhook sender role doesn't match. Excpected: 'exchange_oracle', received: {role}."
        )
