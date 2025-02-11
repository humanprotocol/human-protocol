from collections.abc import Callable, Iterable, Iterator, Mapping, Sequence
from typing import TypeVar

_K = TypeVar("_K")
_V = TypeVar("_V")


def grouped(
    items: Iterator[_V] | Iterable[_V], *, key: Callable[[_V], _K]
) -> Mapping[_K, Sequence[_V]]:
    """
    Returns a mapping with input iterable elements grouped by key, for example:

    grouped(
        [("apple1", "red"), ("apple2", "green"), ("apple3", "red")],
        key=lambda v: v[1]
    )
    ->
    {
        "red": [("apple1", "red"), ("apple3", "red")],
        "green": [("apple2", "green")]
    }

    Similar to itertools.groupby, but allows reiteration on resulting groups.
    """

    # Can be implemented with itertools.groupby, but it requires extra sorting for input elements
    grouped_items = {}
    for item in items:
        grouped_items.setdefault(key(item), []).append(item)

    return grouped_items
