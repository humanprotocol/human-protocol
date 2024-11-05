from typing import Annotated, TypeVar

import fastapi
import fastapi.params

T = TypeVar("T")

OptionalQuery = Annotated[T | None, fastapi.Query()]
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
