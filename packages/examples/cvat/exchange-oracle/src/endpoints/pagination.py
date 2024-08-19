from __future__ import annotations

from typing import Any, Optional, Sequence, TypeVar

import fastapi_pagination.bases
import fastapi_pagination.default
from fastapi import Query
from fastapi_pagination.ext.sqlalchemy import paginate
from pydantic import Field

from src.core.config import Config


class PaginationParams(fastapi_pagination.default.Params):
    size: int = Query(
        Config.api_config.default_page_size,
        ge=1,
        description="Page size",
        alias="page_size",
        validation_alias="page_size",
    )


T = TypeVar("T")


class Page(fastapi_pagination.default.Page[T]):
    __params_type__ = PaginationParams

    items: Sequence[T] = Field(alias="results", validation_alias="items")
    total: Optional[fastapi_pagination.default.GreaterEqualZero] = Field(
        alias="total_results", validation_alias="total"
    )
    pages: Optional[fastapi_pagination.default.GreaterEqualZero] = Field(
        default=None, alias="total_pages", validation_alias="pages"
    )
    size: Optional[fastapi_pagination.default.GreaterEqualOne] = Field(
        alias="page_size", validation_alias="size"
    )

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
