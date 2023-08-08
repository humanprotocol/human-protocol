from typing import Dict

from src.constants import Networks
from src.modules.chain.web3 import sign_message


def prepare_recording_oracle_webhook_body(
    escrow_address: str,
    chain_id: Networks,
    s3_url: str,
) -> Dict:
    body = {"escrow_address": escrow_address, "chain_id": chain_id, "s3_url": s3_url}

    return body


def prepare_signature(escrow_address: str, chain_id: Networks, s3_url: str) -> str:
    message = prepare_recording_oracle_webhook_body(escrow_address, chain_id, s3_url)
    signature = sign_message(chain_id, message)

    return signature
