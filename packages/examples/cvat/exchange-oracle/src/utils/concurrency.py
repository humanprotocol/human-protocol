from functools import partial

from anyio import from_thread, to_thread


def _check_backend():
    import fastapi.concurrency

    assert hasattr(fastapi.concurrency, "anyio")


async def fastapi_set_max_threads(max_threads: int):
    """
    Sets the maximum number of active threads in the sync worker pool of FastAPI.
    This affects the maximum number of active blocking requests
    (the endpoints defined as non-async def ...) in each process.

    """
    _check_backend()

    # https://anyio.readthedocs.io/en/stable/threads.html#adjusting-the-default-maximum-worker-thread-count
    to_thread.current_default_thread_limiter().total_tokens = max_threads


def run_as_sync(async_fn, *args, **kwargs):
    """
    Runs an async function synchronously.
    Supposed to be called in blocking endpoints (defined as def ...)
    """
    _check_backend()

    if args or kwargs:
        async_fn = partial(async_fn, *args, **kwargs)

    with from_thread.start_blocking_portal() as portal:
        return portal.call(async_fn)
