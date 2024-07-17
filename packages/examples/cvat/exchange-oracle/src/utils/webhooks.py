from datetime import datetime
from typing import Dict, Optional, Tuple

from src.chain.web3 import sign_message
from src.core.oracle_events import parse_event
from src.core.types import Networks, OracleWebhookTypes


def prepare_outgoing_webhook_body(
    escrow_address: str,
    chain_id: Networks,
    event_type: str,
    event_data: dict,
    timestamp: Optional[datetime],
) -> Dict:
    body = {"escrow_address": escrow_address, "chain_id": chain_id}

    if timestamp:
        body["timestamp"] = timestamp.isoformat(" ")

    event = parse_event(OracleWebhookTypes.exchange_oracle, event_type, event_data)
    body["event_type"] = event_type

    body["event_data"] = event.model_dump()
    if not body["event_data"]:
        body.pop("event_data")

    return body


def prepare_signed_message(
    escrow_address: str,
    chain_id: Networks,
    message: Optional[str] = None,
    body: Optional[dict] = None,
) -> Tuple[str, str]:
    """
    Sign the message with the service identity.
    Optionally, can serialize the input structure.
    """

    assert (message is not None) ^ (body is not None), "Either 'message' or 'body' expected"

    signature, serialized_message = sign_message(chain_id, body if body is not None else message)

    return serialized_message, signature
