from pydantic import BaseModel, validator
from typing import Optional

from src.constants import Networks
from src.modules.chain.escrow import validate_address


class CvatWebhook(BaseModel):
    event: str
    job: Optional[dict]
    task: Optional[dict]
    before_update: Optional[dict]


class JLWebhook(BaseModel):
    escrow_address: str
    chain_id: Networks

    @validator("escrow_address", allow_reuse=True)
    def validate_escrow_(cls, value):
        return validate_address(value)

    # pylint: disable=too-few-public-methods
    class Config:
        schema_extra = {
            "example": {
                "escrow_address": "0x199c44cfa6a84554ac01f3e3b01d7cfce38a75eb",
                "chain_id": 80001,
            }
        }


class JLWebhookResponse(BaseModel):
    id: str
