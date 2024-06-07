from datetime import datetime
from typing import Optional

from pydantic import BaseModel, validator

from src.chain.web3 import validate_address
from src.core.types import JobLauncherEventTypes, Networks


class OracleWebhook(BaseModel):
    escrow_address: str
    chain_id: Networks
    event_type: str
    event_data: Optional[dict] = None
    timestamp: Optional[datetime] = None  # TODO: remove optional

    @validator("escrow_address", allow_reuse=True)
    def validate_escrow_(cls, value):
        return validate_address(value)

    # pylint: disable=too-few-public-methods
    class Config:
        schema_extra = {
            "example": {
                "escrow_address": "0x199c44cfa6a84554ac01f3e3b01d7cfce38a75eb",
                "chain_id": 80002,
                "event_type": JobLauncherEventTypes.escrow_created.value,
                "event_data": {},
            }
        }


class OracleWebhookResponse(BaseModel):
    id: str
