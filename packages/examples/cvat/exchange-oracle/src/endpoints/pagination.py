from __future__ import annotations

from typing import TYPE_CHECKING, Any, TypeVar

import fastapi_pagination.bases
import fastapi_pagination.default
from fastapi import Query
from fastapi_pagination.ext.sqlalchemy import paginate
from pydantic import Field

from src.core.config import Config

if TYPE_CHECKING:
    from collections.abc import Sequence

FIRST_PAGE = 0


class PaginationParams(fastapi_pagination.default.Params):
    page: int = Query(FIRST_PAGE, ge=FIRST_PAGE, description="Page number")
    size: int = Query(
        Config.api_config.default_page_size,
        ge=Config.api_config.min_page_size,
        le=Config.api_config.max_page_size,
        description="Page size",
        alias="page_size",  # request query parameter name
    )

    def to_raw_params(self) -> fastapi_pagination.bases.RawParams:
        if FIRST_PAGE == 0:
            return fastapi_pagination.bases.RawParams(
                limit=self.size,
                offset=self.size * self.page,
            )
        return super().to_raw_params()


T = TypeVar("T")


class Page(fastapi_pagination.default.Page[T]):
    __params_type__ = PaginationParams

    page: fastapi_pagination.default.GreaterEqualZero = Field(
        validation_alias="page",
        default=FIRST_PAGE,
    )
    items: Sequence[T] = Field(alias="results", validation_alias="items")
    total: fastapi_pagination.default.GreaterEqualZero | None = Field(
        alias="total_results",  # response parameter name
        validation_alias="total",
    )
    pages: fastapi_pagination.default.GreaterEqualZero = Field(
        default=FIRST_PAGE,
        alias="total_pages",  # response parameter name
        validation_alias="pages",
    )
    size: fastapi_pagination.default.GreaterEqualOne = Field(
        validation_alias="size",
        alias="page_size",  # response parameter name
        default=Config.api_config.default_page_size,
    )

    @classmethod
    def create(
        cls,
        items: Sequence[T],
        params: fastapi_pagination.bases.AbstractParams,
        *,
        total: int | None = None,
        **kwargs: Any,
    ) -> Page[T]:
        assert isinstance(params, PaginationParams)
        return super().create(items, params, total=total, **kwargs)


__all__ = ["PaginationParams", "Page", "paginate"]
