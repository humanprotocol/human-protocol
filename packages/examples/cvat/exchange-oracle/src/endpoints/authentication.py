from typing import Annotated, TypeVar

import jwt
import pydantic
from fastapi import Depends, HTTPException, params, status
from fastapi.exceptions import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.security import HTTPBearer as BaseHTTPBearer
from pydantic import BaseModel, model_validator
from starlette.requests import Request

from src.core.config import Config


# https://github.com/fastapi/fastapi/issues/2026
class HTTPBearer(BaseHTTPBearer):
    async def __call__(self, request: Request) -> HTTPAuthorizationCredentials | None:
        try:
            return await super().__call__(request)
        except HTTPException as ex:
            if ex.status_code == status.HTTP_403_FORBIDDEN and ex.detail == "Not authenticated":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=ex.detail,
                ) from ex


# Customized JWT-token authorization
AuthorizationDependency = HTTPBearer(scheme_name="jwt_bearer")
AuthorizationToken = HTTPAuthorizationCredentials

HUMAN_APP_ROLE = "human_app"


class AuthorizationData(BaseModel):
    wallet_address: str
    email: str


AuthDataT = TypeVar("AuthDataT", bound=AuthorizationData)


class JobListAuthorizationData(AuthorizationData):
    wallet_address: str | None = None
    email: str
    role: str | None = None

    @model_validator(mode="after")
    def validate_optional_fields(self):
        if not self.wallet_address and self.role != HUMAN_APP_ROLE:
            raise ValueError(f"'wallet_address' cannot be empty when role is '{self.role}'")

        return self


class TokenAuthenticator:
    def __init__(self, *, auth_data_class: AuthDataT = AuthorizationData) -> None:
        self._auth_data_class = auth_data_class

    async def authenticate_token(
        self, token: Annotated[AuthorizationToken, Depends(AuthorizationDependency)]
    ) -> AuthDataT:
        # Can't use a custom pydantic model in Depends() (as a sub-dependancy),
        # and have fields correctly parsed as non-query params
        # Read more https://github.com/tiangolo/fastapi/issues/1474
        # Without Depends schema works, but not validation.
        # Thus, just use it as a separate function explicitly.

        try:
            payload = jwt.decode(
                token.credentials, Config.human_app_config.jwt_public_key, algorithms=["ES256"]
            )
            return self._auth_data_class.model_validate(payload)
        except (jwt.PyJWTError, pydantic.ValidationError) as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            ) from e


def make_auth_dependency(auth_data_class: AuthDataT | None = None) -> params.Depends:
    if auth_data_class:
        authenticator = TokenAuthenticator(auth_data_class=auth_data_class)
    else:
        authenticator = TokenAuthenticator()

    return Depends(authenticator.authenticate_token)


AuthorizationParam = make_auth_dependency()
