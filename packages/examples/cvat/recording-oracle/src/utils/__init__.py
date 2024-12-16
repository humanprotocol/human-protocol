from collections.abc import Callable, Iterable, Iterator, Mapping, Sequence
from itertools import groupby
from typing import TypeVar

_K = TypeVar("_K")
_V = TypeVar("_V")


def grouped(
    data: Iterator[_V] | Iterable[_V], *, key: Callable[[_V], _K]
) -> Mapping[_K, Sequence[_V]]:
    """
    Returns a mapping with input iterable elements grouped by key, for example:

    [("apple1", "red"), ("apple2", "green"), ("apple3", "red")]
    key=lambda v: v[1]

    ->

    {
        "red": [("apple1", "red"), ("apple3", "red")],
        "green": [("apple2", "green")]
    }

    Similar to itertools.groupby, but allows reiteration on resulting groups.
    """

    return {
        group_key: list(group_iter)
        for group_key, group_iter in groupby(sorted(data, key=key), key=key)
    }
