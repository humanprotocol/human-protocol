from typing import TypeVar

from fastapi import HTTPException

T = TypeVar("T")
V = TypeVar("V")


def get_or_404(
    obj: T | None,
    object_id: V,
    object_type_name: str,
    *,
    reason: str | None = None,
) -> T:
    if obj is None:
        raise HTTPException(
            status_code=404,
            detail=reason or f"Can't find {object_type_name} with id {object_id}",
        )

    return obj
