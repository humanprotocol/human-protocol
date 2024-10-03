from __future__ import annotations

from enum import Enum
from typing import TYPE_CHECKING, Any, ClassVar, TypeVar

import fastapi
import fastapi.params
import sqlalchemy
import sqlalchemy.orm
from fastapi_filter import FilterDepends, with_prefix
from fastapi_filter.contrib.sqlalchemy import Filter as _Filter
from pydantic import BaseModel, Field, ValidationInfo, field_validator

from src.utils.enums import BetterEnumMeta

if TYPE_CHECKING:
    from pydantic.fields import FieldInfo


class OrderingDirection(str, Enum, metaclass=BetterEnumMeta):
    asc = "ASC"
    desc = "DESC"

    @classmethod
    def _missing_(cls, value) -> OrderingDirection:
        # allow registry independency for convenience
        value = value.upper()
        for member in cls:
            if member.upper() == value:
                return member
        return None


ModelT = TypeVar("ModelT", bound=BaseModel)


class Filter(_Filter):
    class Constants(_Filter.Constants):
        ordering_field_name = None

        # Could potentially use the "alias" param, but it doesn't fully work.
        # The schema name changes, but it doesn't get parsed. In the validation errors
        # it also uses the class member name instead of alias.
        # Probably, it requires using "by_alias" in several places
        sorting_direction_field_name: ClassVar[str | None] = None
        sorting_field_name: ClassVar[str | None] = None

        selector_field_name: ClassVar[str | None] = None
        selectable_fields_enum_name: ClassVar[str | None] = None

    @classmethod
    def _default_sorting_direction_param(cls) -> tuple[type, FieldInfo]:
        return (
            OrderingDirection | None,
            Field(
                fastapi.Query(
                    default=OrderingDirection.asc,
                    json_schema_extra={"enum": list(OrderingDirection.__members__.values())},
                )
            ),
        )

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
        self, query: sqlalchemy.orm.Query | sqlalchemy.Select
    ) -> sqlalchemy.orm.Query | sqlalchemy.Select:
        if self.Constants.sorting_field_name:
            direction_value = getattr(
                self, self.Constants.sorting_direction_field_name
            ) or self.get_default_field_value(self.Constants.sorting_direction_field_name)

            order_by_param_value = getattr(
                self, self.Constants.sorting_field_name
            ) or self.get_default_field_value(self.Constants.sorting_field_name)

            sorting_func = {
                OrderingDirection.asc: sqlalchemy.asc,
                OrderingDirection.desc: sqlalchemy.desc,
            }[direction_value]

            sorting_args = [sorting_func(order_by_param_value.value)]

            if (
                default_sort_field := getattr(self, "default_sort_field", None)
            ) and default_sort_field != order_by_param_value:
                # multi-criteria sorting
                sorting_args.append(sorting_func(default_sort_field.value))

            query = query.order_by(*sorting_args)

        return query

    def filter_(
        self, query: sqlalchemy.orm.Query | sqlalchemy.Select
    ) -> sqlalchemy.orm.Query | sqlalchemy.Select:
        return super().filter(query)

    def select_fields_(self, value: ModelT) -> dict[str, Any]:
        if not self.Constants.selector_field_name:
            return value

        selectable_fields = self._selectable_fields
        if not selectable_fields:
            return value

        selector_field_value = getattr(
            self, self.Constants.selector_field_name
        ) or self.get_default_field_value(self.Constants.selector_field_name)

        if not selector_field_value:
            return value

        excluded_fields = set(selectable_fields).difference(selector_field_value)
        return value.model_dump(exclude=excluded_fields)

    @property
    def _selectable_fields(self) -> list[str] | None:
        if not self.Constants.selectable_fields_enum_name:
            return None

        selectable_fields_enum: type[Enum] = getattr(
            self, self.Constants.selectable_fields_enum_name
        )
        return list(selectable_fields_enum.__members__)

    @classmethod
    def get_default_field_value(cls, field_name: str) -> Any:
        default_value = _get_field_info(cls, field_name).get_default()
        if isinstance(default_value, fastapi.params.FieldInfo):
            default_value = default_value.get_default()

        return default_value

    @field_validator("*", mode="before")
    def split_selectable_fields(cls, value, field: ValidationInfo):
        if field.field_name == cls.Constants.selector_field_name:
            if not value:
                return cls.get_default_field_value(field.field_name)
            return [v.strip() for v in value.split(",")]
        return value


def _get_field_info(klass: type[BaseModel], field_name: str):
    return klass.model_fields[field_name]


__all__ = ["Filter", "FilterDepends", "with_prefix", "OrderingDirection"]
