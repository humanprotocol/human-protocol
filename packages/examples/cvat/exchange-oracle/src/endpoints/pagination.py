from __future__ import annotations

from typing import Any, Optional, Sequence, TypeVar

import fastapi_pagination.bases
import fastapi_pagination.default
from fastapi_pagination.ext.sqlalchemy import paginate
from pydantic import BaseModel


class PaginationParams(BaseModel, fastapi_pagination.bases.AbstractParams):
    # The same as fastapi_pagination.default.Params except size is renamed into page_size
    assert fastapi_pagination.default.Params.model_fields["page"]
    assert fastapi_pagination.default.Params.model_fields["size"]

    page: int = fastapi_pagination.default.Params.model_fields["page"]
    page_size: int = fastapi_pagination.default.Params.model_fields["size"]

    def to_params(self) -> fastapi_pagination.default.Params:
        return fastapi_pagination.default.Params(page=self.page, size=self.page_size)

    def to_raw_params(self) -> fastapi_pagination.bases.RawParams:
        return self.to_params().to_raw_params()


T = TypeVar("T")


class Page(fastapi_pagination.default.Page):
    __params_type__ = PaginationParams

    @classmethod
    def create(
        cls,
        items: Sequence[T],
        params: fastapi_pagination.bases.AbstractParams,
        *,
        total: Optional[int] = None,
        **kwargs: Any,
    ) -> Page:
        assert isinstance(params, PaginationParams)
        return super().create(items, params.to_params(), total=total, **kwargs)


__all__ = ["PaginationParams", "Page", "paginate"]
