from enum import Enum
from typing import Optional, Union

import fastapi
import sqlalchemy
import sqlalchemy.orm
from fastapi_filter import FilterDepends, with_prefix
from fastapi_filter.contrib.sqlalchemy import Filter as _Filter

from src.utils.enums import BetterEnumMeta


class OrderingDirection(str, Enum, metaclass=BetterEnumMeta):
    asc = "asc"
    desc = "desc"


class Filter(_Filter):
    class Constants(_Filter.Constants):
        ordering_field_name = None
        sorting_param = "sort_"
        sorting_field_name = "created_at"

    sort_: Optional[OrderingDirection] = fastapi.Query(default=None, alias="sort")

    @property
    def filtering_fields(self):
        fields = dict(super().filtering_fields)
        fields.pop(self.Constants.sorting_param, None)
        return fields.items()

    def sort(
        self, query: Union[sqlalchemy.orm.Query, sqlalchemy.Select]
    ) -> Union[sqlalchemy.orm.Query, sqlalchemy.Select]:
        if self.Constants.sorting_field_name:
            order_by_param = getattr(self, self.Constants.sorting_param) or OrderingDirection.asc
            order_by_field = getattr(self.Constants.model, self.Constants.sorting_field_name)
            query = query.order_by(getattr(order_by_field, order_by_param.value)())

        return query


__all__ = ["FilterDepends, with_prefix, OrderingDirection", "Filter"]
