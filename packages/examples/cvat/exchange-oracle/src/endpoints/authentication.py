import pydantic
from fastapi import Depends, Header, HTTPException, status
from jose import JWTError, jwt
from pydantic import BaseModel

from src.core.config import Config


class AuthorizationHeader(BaseModel):
    authorization: str = Header(alias="Authorization", validation_alias="Authorization")


class AuthData(BaseModel):
    wallet_address: str
    email: str


async def authenticate_token(token: AuthorizationHeader = Depends()) -> AuthData:
    try:
        payload = jwt.decode(token.authorization, Config.human_app_config.jwt_key)
        return AuthData.model_validate(payload)
    except (JWTError, pydantic.ValidationError) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e
