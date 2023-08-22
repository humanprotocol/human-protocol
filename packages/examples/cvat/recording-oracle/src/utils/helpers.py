import json
from typing import Dict
from human_protocol_sdk.storage import StorageClient

from src.core.constants import Networks
from src.chain.web3 import sign_message


def prepare_reputation_oracle_webhook_body(
    escrow_address: str, chain_id: Networks
) -> Dict:
    body = {"escrow_address": escrow_address, "chain_id": chain_id}

    return body


def prepare_signature(escrow_address: str, chain_id: Networks) -> str:
    message = prepare_reputation_oracle_webhook_body(escrow_address, chain_id)
    signature = sign_message(chain_id, message)

    return signature


def get_intermediate_results(s3_url: str):
    intermediate_results = json.loads(
        StorageClient.download_file_from_url(s3_url).decode("utf-8")
    )
    return intermediate_results
