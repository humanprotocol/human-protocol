from collections.abc import AsyncGenerator, Callable
from contextlib import asynccontextmanager
from typing import Annotated, Any, TypeVar

import fastapi
import fastapi.params

_T = TypeVar("_T")

OptionalQuery = Annotated[_T | None, fastapi.Query()]
"""
Required to declare query parameters with default values in Depends.

Simply using Query is not enough to include parameter description in the OpenAPI schema
https://github.com/tiangolo/fastapi/issues/4700

Example:
from fastapi import Depends

class Dependency:
    query_param: OptionalQuery[str] = None

@...
def endpoint(
    dependency: Dependency = Depends(Dependency)
):
    ...
"""

_App = TypeVar("_App", bound=fastapi.FastAPI)


def register_lifespan_context(
    app: _App, lifespan_context: Callable[[_App], AsyncGenerator[Any, None, None]]
) -> _App:
    router = app.router
    original_lifespan_context = router.lifespan_context

    @asynccontextmanager
    async def wrapped_lifespan(app: _App) -> AsyncGenerator[Any, None, None]:
        async with lifespan_context(app), original_lifespan_context(app) as maybe_state:
            yield maybe_state

    router.lifespan_context = wrapped_lifespan
    return app
