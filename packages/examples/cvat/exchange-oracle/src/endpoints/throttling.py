from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any

import redis.asyncio as redis
from fastapi import FastAPI
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter

from src.core.config import Config


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[Any]:
    redis_connection = redis.from_url(Config.redis_config.connection_url(), encoding="utf8")
    await FastAPILimiter.init(redis_connection)

    try:
        yield
    finally:
        await FastAPILimiter.close()  # supposed to be aclose, but has a different name


def add_throttling(app: FastAPI):
    router = app.router
    original_lifespan_context = router.lifespan_context

    @asynccontextmanager
    async def wrapped_lifespan(app: FastAPI) -> AsyncIterator[Any]:
        async with lifespan(app), original_lifespan_context(app) as maybe_state:
            yield maybe_state

    router.lifespan_context = wrapped_lifespan
    return app


__all__ = ["add_throttling", "RateLimiter"]
