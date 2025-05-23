from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator

from src.chain.web3 import validate_address
from src.core.types import ExchangeOracleEventTypes, Networks


class OracleWebhook(BaseModel):
    escrow_address: str
    chain_id: Networks
    event_type: str
    event_data: dict | None = None
    timestamp: datetime | None = None  # TODO: remove optional

    @field_validator("escrow_address")
    @classmethod
    def validate_escrow_(cls, value: str) -> str:
        return validate_address(value)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "escrow_address": "0x199c44cfa6a84554ac01f3e3b01d7cfce38a75eb",
                "chain_id": 80002,
                "event_type": ExchangeOracleEventTypes.job_finished.value,
                "event_data": {},
            }
        }
    )


class OracleWebhookResponse(BaseModel):
    id: str
