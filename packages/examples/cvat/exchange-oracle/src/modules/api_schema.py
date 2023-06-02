from pydantic import BaseModel, validator
from typing import Optional

from web3 import Web3
from src.constants import Networks


class CvatWebhook(BaseModel):
    event: str
    job: Optional[dict]
    task: Optional[dict]
    before_update: Optional[dict]


class JLWebhook(BaseModel):
    escrow_address: str
    network: Networks

    @validator("escrow_address", allow_reuse=True)
    def validate_escrow_address(cls, value):
        if not Web3.isAddress(value):
            raise ValueError("Address is not a correct Web3 address")
        return Web3.toChecksumAddress(value)

    # pylint: disable=too-few-public-methods
    class Config:
        schema_extra = {
            "example": {
                "escrow_address": "0x199c44cfa6a84554ac01f3e3b01d7cfce38a75eb",
                "network": "polygon_mainnet",
            }
        }


class JLWebhookResponse(BaseModel):
    id: str
