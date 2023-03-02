from pydantic import BaseModel, HttpUrl, validator
from web3 import Web3

from .constants import Networks


def to_checksum_addr(addr: str) -> str:
    if not Web3.isAddress(addr):
        raise ValueError("Address is not a correct Web3 address")

    return Web3.toChecksumAddress(addr)


class JLWebhook(BaseModel):
    escrow_address: str
    s3_url: HttpUrl
    network: Networks
    _escrow_addr_checksum = validator("escrow_address", allow_reuse=True)(
        to_checksum_addr
    )

    # pylint: disable=too-few-public-methods
    class Config:
        schema_extra = {
            "example": {
                "escrow_address": "0x199c44cfa6a84554ac01f3e3b01d7cfce38a75eb",
                "s3_url": "https://path_to_s3_file",
            }
        }


class JLWebhookResponse(BaseModel):
    id: str
