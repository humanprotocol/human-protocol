from __future__ import annotations

from typing import Any, Optional, Sequence, TypeVar

import fastapi_pagination.bases
import fastapi_pagination.default
from fastapi import Query
from fastapi_pagination.ext.sqlalchemy import paginate
from pydantic import Field

DEFAULT_PAGE_SIZE = 5


class PaginationParams(fastapi_pagination.default.Params):
    size: int = Query(
        DEFAULT_PAGE_SIZE,
        ge=1,
        description="Page size",
        alias="page_size",
        validation_alias="page_size",
    )


T = TypeVar("T")


class Page(fastapi_pagination.default.Page[T]):
    __params_type__ = PaginationParams

    items: Sequence[T] = Field(alias="results", validation_alias="items")

    @classmethod
    def create(
        cls,
        items: Sequence[T],
        params: fastapi_pagination.bases.AbstractParams,
        *,
        total: Optional[int] = None,
        **kwargs: Any,
    ) -> Page[T]:
        assert isinstance(params, PaginationParams)
        return super().create(items, params, total=total, **kwargs)


__all__ = ["PaginationParams", "Page", "paginate"]
