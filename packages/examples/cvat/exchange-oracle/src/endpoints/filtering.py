from __future__ import annotations

from collections.abc import Iterable
from copy import deepcopy
from types import UnionType
from typing import TYPE_CHECKING, Any, ClassVar, Optional, TypeVar, Union, get_args, get_origin

import fastapi
import fastapi.params
import sqlalchemy
import sqlalchemy.orm
from fastapi import Depends
from fastapi.exceptions import RequestValidationError
from fastapi_filter import with_prefix
from fastapi_filter.contrib.sqlalchemy import Filter as _Filter
from pydantic import (
    BaseModel,
    Field,
    ValidationError,
    ValidationInfo,
    create_model,
    field_validator,
)

from src.utils.enums import BetterEnumMeta, StrEnum

_UNION_TYPES = (Union, UnionType)

if TYPE_CHECKING:
    from enum import Enum

    from pydantic.fields import FieldInfo


class OrderingDirection(StrEnum, metaclass=BetterEnumMeta):
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

            # Accept both popular formats:
            # - a single comma-separated value ("?fields=a,b")
            # - repeated params ("?fields=a&fields=b")
            # and any mix of them.
            if isinstance(value, str):
                value = [value]

            return [item.strip() for entry in value for item in str(entry).split(",")]

        return value


def _get_field_info(klass: type[BaseModel], field_name: str):
    return klass.model_fields[field_name]


def _list_to_str_fields(filter_cls: type[_Filter]) -> dict[str, tuple[Any, Any]]:
    # Reimplements fastapi_filter's _list_to_str_fields, but keeps the selector field
    # as a real list type so that FastAPI parses repeated params ("?fields=a&fields=b")
    # into a list. The list element type is relaxed to str so that a single
    # comma-separated value ("?fields=a,b") also passes through untouched to the
    # filter's own `split_selectable_fields` validator.
    selector_field_name = getattr(filter_cls.Constants, "selector_field_name", None)

    ret: dict[str, tuple[Any, Any]] = {}
    for name, f in filter_cls.model_fields.items():
        field_info = deepcopy(f)
        annotation = f.annotation

        if get_origin(annotation) in _UNION_TYPES:
            annotation_args: list = list(get_args(f.annotation))
            if type(None) in annotation_args:
                annotation_args.remove(type(None))
            if len(annotation_args) == 1:
                annotation = annotation_args[0]

        is_list = annotation is list or get_origin(annotation) is list
        if not is_list:
            ret[name] = (f.annotation, field_info)
        elif name == selector_field_name:
            ret[name] = (list[str] | None, field_info)
        else:
            if isinstance(field_info.default, Iterable):
                field_info.default = ",".join(field_info.default)
            ret[name] = (str if f.is_required() else Optional[str], field_info)  # noqa: UP045

    return ret


def FilterDepends(  # noqa: N802 (public API name kept for drop-in compatibility)
    filter_cls: type[_Filter], *, by_alias: bool = False, use_cache: bool = True
) -> Any:
    # Check https://github.com/fastapi/fastapi/issues/50 for more info
    # Local variant of fastapi_filter.FilterDepends that preserves the selector field
    # as a list, enabling both the comma-separated and the repeated-param formats.
    Filter = filter_cls  # match the original function naming
    fields = _list_to_str_fields(Filter)
    GeneratedFilter: type[BaseModel] = create_model(Filter.__class__.__name__, **fields)

    class FilterWrapper(GeneratedFilter):  # type: ignore[misc, valid-type]
        def __new__(cls, *args, **kwargs):
            try:
                instance = GeneratedFilter(*args, **kwargs)
                data = instance.model_dump(
                    exclude_unset=True, exclude_defaults=True, by_alias=by_alias
                )
                if original_filter := getattr(Filter.Constants, "original_filter", None):
                    prefix = f"{Filter.Constants.prefix}__"
                    stripped = {}
                    # TODO: replace with `removeprefix` when python 3.8 is no longer supported
                    # stripped = {k.removeprefix(NestedFilter.Constants.prefix): v for k, v in value.items()}  # noqa: E501
                    for k, v in data.items():
                        if k.startswith(prefix):
                            k = k.replace(prefix, "", 1)
                        stripped[k] = v
                    return original_filter(**stripped)
                return Filter(**data)
            except ValidationError as e:
                raise RequestValidationError(e.errors()) from e

    return Depends(FilterWrapper, use_cache=use_cache)


__all__ = ["Filter", "FilterDepends", "OrderingDirection", "with_prefix"]
