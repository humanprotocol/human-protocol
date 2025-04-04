from collections.abc import Callable, Iterable
from queue import Queue
from typing import Generic, TypeVar

T = TypeVar("T")
R = TypeVar("R")


class BufferedRoiImageUploader(Generic[R]):
    def __init__(self, queue: Queue[R]):
        self.queue = queue

    def process_all(
        self,
        items: Iterable[T],
        *,
        put_callback: Callable[[T], R | None],
        process_callback: Callable[[R], None],
    ):
        "Put items into the queue and process them until the input items are exhausted"

        item_iter = iter(items)
        while True:
            result = self.fill_and_get(item_iter, put_callback=put_callback)
            if result is None:
                break

            process_callback(result)

    def fill_and_get(
        self, items: Iterable[T], *, put_callback: Callable[[T], R | None]
    ) -> R | None:
        "put() as many items into the queue as possible, try to get() one"

        queue = self.queue
        item_iter = iter(items)
        while not queue.full() and (item := next(item_iter, None)) is not None:
            task = put_callback(item)
            if not task:
                continue

            queue.put(task)

        if queue.empty():
            return None

        return queue.get()
