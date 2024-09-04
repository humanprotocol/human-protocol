from typing import Annotated

import pydantic
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel

from src.core.config import Config

# Customized JWT-token authorization
AuthorizationDependency = HTTPBearer(scheme_name="jwt_bearer")
AuthorizationToken = HTTPAuthorizationCredentials


class AuthorizationData(BaseModel):
    wallet_address: str
    email: str


async def authenticate_token(
    token: Annotated[AuthorizationToken, Depends(AuthorizationDependency)],
) -> AuthorizationData:
    # Can't use a custom pydantic model in Depends() (as a sub-dependancy),
    # and have fields correctly parsed as non-query params
    # Read more https://github.com/tiangolo/fastapi/issues/1474
    # Without Depends schema works, but not validation.
    # Thus, just use it as a separate function explicitly.

    try:
        payload = jwt.decode(token.credentials, Config.human_app_config.jwt_key)
        return AuthorizationData.model_validate(payload)
    except (JWTError, pydantic.ValidationError) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e


AuthorizationParam = Depends(authenticate_token)
