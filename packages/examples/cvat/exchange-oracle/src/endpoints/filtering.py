from enum import Enum
from typing import Optional, Type, Union

import fastapi
import fastapi.params
import sqlalchemy
import sqlalchemy.orm
from fastapi_filter import FilterDepends, with_prefix
from fastapi_filter.contrib.sqlalchemy import Filter as _Filter
from pydantic import BaseModel
from pydantic.fields import FieldInfo

from src.utils.enums import BetterEnumMeta


class OrderingDirection(str, Enum, metaclass=BetterEnumMeta):
    asc = "asc"
    desc = "desc"


class Filter(_Filter):
    class Constants(_Filter.Constants):
        ordering_field_name = None

        # Could potentially use the "alias" param, but it doesn't fully work.
        # The schema name changes, but it doesn't get parsed. In the validation errors
        # it also uses the class member name instead of alias.
        sorting_direction_field_name = "sorting_direction"
        sorting_field_name = "sorting"

    @classmethod
    def _default_sorting_direction_param(cls) -> tuple[Type, FieldInfo]:
        return (Optional[OrderingDirection], fastapi.Query(default=OrderingDirection.asc))

    @property
    def filtering_fields(self):
        fields = dict(super().filtering_fields)

        for field_name in [
            self.Constants.sorting_direction_field_name,
            self.Constants.sorting_field_name,
        ]:
            param_name = self._get_field_param_name(field_name)
            fields.pop(param_name, None)

        return fields.items()

    def sort_(
        self, query: Union[sqlalchemy.orm.Query, sqlalchemy.Select]
    ) -> Union[sqlalchemy.orm.Query, sqlalchemy.Select]:
        if self.Constants.sorting_field_name:
            direction_param_info = self._get_field_info(self.Constants.sorting_direction_field_name)
            order_by_param_info = self._get_field_info(self.Constants.sorting_field_name)

            direction_value = (
                getattr(self, self.Constants.sorting_direction_field_name)
                or direction_param_info.default
            )

            order_by_param_value = (
                getattr(self, self.Constants.sorting_field_name) or order_by_param_info.default
            )
            order_by_model_field = getattr(self.Constants.model, order_by_param_value)

            query = query.order_by(getattr(order_by_model_field, direction_value.value)())

        return query

    def filter_(
        self, query: Union[sqlalchemy.orm.Query, sqlalchemy.Select]
    ) -> Union[sqlalchemy.orm.Query, sqlalchemy.Select]:
        return super().filter(query)

    def _get_field_info(self, field_name: str) -> FieldInfo:
        return _get_instance_field_info(self, field_name)

    def _get_field_param_name(self, field_name: str) -> str:
        field = self._get_field_info(field_name)
        return field.alias or field_name


def _get_instance_field_info(instance: BaseModel, field_name: str) -> FieldInfo:
    return _get_field_info(instance.__class__, field_name)


def _get_field_info(klass: Type[BaseModel], field_name: str):
    return klass.model_fields[field_name]
