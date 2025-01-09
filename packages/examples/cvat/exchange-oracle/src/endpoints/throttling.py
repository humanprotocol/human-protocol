from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter

from src.endpoints.utils import register_lifespan_context
from src.services.redis import get_aredis_client


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator[Any, None, None]:
    await FastAPILimiter.init(get_aredis_client())

    try:
        yield
    finally:
        await FastAPILimiter.close()  # supposed to be aclose, but has a different name


def add_throttling(app: FastAPI):
    return register_lifespan_context(app, lifespan_context=lifespan)


__all__ = ["add_throttling", "RateLimiter"]
