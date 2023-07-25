from pydantic import BaseModel, validator

from src.constants import Networks
from src.modules.chain.web3 import validate_address


class OracleWebhook(BaseModel):
    escrow_address: str
    chain_id: Networks
    s3_url: str

    @validator("escrow_address", allow_reuse=True)
    def validate_escrow_(cls, value):
        return validate_address(value)

    # pylint: disable=too-few-public-methods
    class Config:
        schema_extra = {
            "example": {
                "escrow_address": "0x199c44cfa6a84554ac01f3e3b01d7cfce38a75eb",
                "chain_id": 80001,
                "s3_url": "https://cvat-eo-results.storage.googleapis.com/s3c7d8121830b8bdfd37157ae99a1336206c0a061c.json",
            }
        }


class OracleWebhookResponse(BaseModel):
    id: str
