from dataclasses import dataclass
from typing import TypeVar

from sqlalchemy import Select
from sqlalchemy.orm import Query


@dataclass
class ForUpdateParams:
    skip_locked: bool = False
    nowait: bool = False


T = TypeVar("T", Query, Select)


def maybe_for_update(query: T, enable: bool | ForUpdateParams) -> T:
    if not enable:
        return query

    if isinstance(enable, ForUpdateParams):
        params = enable
    else:
        params = ForUpdateParams()

    return query.with_for_update(
        skip_locked=params.skip_locked,
        nowait=False if params.skip_locked else params.nowait,  # can't be used together
    )
