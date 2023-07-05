from ast import literal_eval
from fastapi import Request

from src.modules.chain.web3 import recover_signer


async def validate_webhook_signature(
    request: Request, human_signature: str, webhook: dict
):
    pass
    # data: bytes = await request.body()
    # message: dict = literal_eval(data.decode("utf-8"))

    # signer = recover_signer(webhook.chain_id, message, human_signature)
