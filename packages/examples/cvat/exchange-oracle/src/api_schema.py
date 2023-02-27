# pylint: disable=too-few-public-methods
""" Schema for API input&output"""

from typing import Optional
from pydantic import BaseModel


class ValidationResultError(BaseModel):
    """Single error in the validation response"""

    field: str
    message: str


class ValidationErrorResponse(BaseModel):
    """Default validation error for the app"""

    errors: list[ValidationResultError]


class ResponseError(BaseModel):
    """Default response schema for error requests"""

    message: str


class SupportedNetwork(BaseModel):
    network_id: str
    hmt_addr: Optional[str]
    escrow_factory_addr: Optional[str]
    public_key: Optional[str]


class MetaResponse(BaseModel):
    """Response for GET / endpoint"""

    message: str
    version: str
    supported_network: SupportedNetwork
