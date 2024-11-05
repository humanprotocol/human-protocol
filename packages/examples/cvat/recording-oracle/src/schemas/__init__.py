"""Schema for API input&output"""

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
    addr: str | None = None


class MetaResponse(BaseModel):
    """Response for GET / endpoint"""

    message: str
    version: str
    supported_networks: list[SupportedNetwork]
