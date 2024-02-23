# pylint: disable=too-few-public-methods

""" Schema for API input&output"""

from typing import List, Optional

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
    chain_id: int
    addr: Optional[str] = None


class MetaResponse(BaseModel):
    """Response for GET / endpoint"""

    message: str
    version: str
    supported_networks: List[SupportedNetwork]
