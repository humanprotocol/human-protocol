from enum import Enum
from typing import Any, ClassVar, Optional, Type, TypeVar, Union

import fastapi
import fastapi.params
import sqlalchemy
import sqlalchemy.orm
from fastapi_filter import FilterDepends, with_prefix
from fastapi_filter.contrib.sqlalchemy import Filter as _Filter
from pydantic import BaseModel, ValidationInfo, field_validator
from pydantic.fields import FieldInfo

from src.utils.enums import BetterEnumMeta


class OrderingDirection(str, Enum, metaclass=BetterEnumMeta):
    asc = "asc"
    desc = "desc"


T = TypeVar("T", bound=BaseModel)


class Filter(_Filter):
    class Constants(_Filter.Constants):
        ordering_field_name = None

        # Could potentially use the "alias" param, but it doesn't fully work.
        # The schema name changes, but it doesn't get parsed. In the validation errors
        # it also uses the class member name instead of alias.
        # Probably, it requires using "by_alias" in several places
        sorting_direction_field_name: ClassVar[Optional[str]] = None
        sorting_field_name: ClassVar[Optional[str]] = None

        selector_field_name: ClassVar[Optional[str]] = None
        selectable_fields_enum_name: ClassVar[Optional[str]] = None

    @classmethod
    def _default_sorting_direction_param(cls) -> tuple[Type, FieldInfo]:
        return (Optional[OrderingDirection], fastapi.Query(default=OrderingDirection.asc))

    @property
    def filtering_fields(self):
        fields = dict(super().filtering_fields)

        for field_name in [
            self.Constants.sorting_direction_field_name,
            self.Constants.sorting_field_name,
            self.Constants.selector_field_name,
        ]:
            if field_name:
                fields.pop(field_name, None)

        return fields.items()

    def sort_(
        self, query: Union[sqlalchemy.orm.Query, sqlalchemy.Select]
    ) -> Union[sqlalchemy.orm.Query, sqlalchemy.Select]:
        if self.Constants.sorting_field_name:
            direction_param_info = self._get_field_info(self.Constants.sorting_direction_field_name)
            order_by_param_info = self._get_field_info(self.Constants.sorting_field_name)

            direction_value = getattr(
                self, self.Constants.sorting_direction_field_name
            ) or direction_param_info.get_default(call_default_factory=True)

            order_by_param_value = getattr(
                self, self.Constants.sorting_field_name
            ) or order_by_param_info.get_default(call_default_factory=True)
            order_by_model_field = getattr(self.Constants.model, order_by_param_value)

            query = query.order_by(getattr(order_by_model_field, direction_value.value)())

        return query

    def filter_(
        self, query: Union[sqlalchemy.orm.Query, sqlalchemy.Select]
    ) -> Union[sqlalchemy.orm.Query, sqlalchemy.Select]:
        return super().filter(query)

    def select_fields_(self, value: T) -> dict[str, Any]:
        if not self.Constants.selector_field_name:
            return value

        selectable_fields = self._selectable_fields
        if not selectable_fields:
            return value

        selector_field_info = self._get_field_info(self.Constants.selector_field_name)
        selector_field_value = getattr(
            self, self.Constants.selector_field_name
        ) or selector_field_info.get_default(call_default_factory=True)

        if not selector_field_value:
            return value

        excluded_fields = set(selectable_fields).difference(selector_field_value)
        return value.model_dump(exclude=excluded_fields)

    def _get_field_info(self, field_name: str) -> FieldInfo:
        return _get_instance_field_info(self, field_name)

    @property
    def _selectable_fields(self) -> Optional[list[str]]:
        if not self.Constants.selectable_fields_enum_name:
            return None

        selectable_fields_enum: Type[Enum] = getattr(
            self, self.Constants.selectable_fields_enum_name
        )
        selectable_fields = list(selectable_fields_enum.__members__)
        return selectable_fields

    @field_validator("*", mode="before")
    def split_selectable_fields(cls, value, field: ValidationInfo):
        if field.field_name == cls.Constants.selector_field_name:
            if not value:
                return cls.model_fields[field.field_name].get_default(call_default_factory=True)
            return list(value.split(","))
        return value


def _get_instance_field_info(instance: BaseModel, field_name: str) -> FieldInfo:
    return _get_field_info(instance.__class__, field_name)


def _get_field_info(klass: Type[BaseModel], field_name: str):
    return klass.model_fields[field_name]
