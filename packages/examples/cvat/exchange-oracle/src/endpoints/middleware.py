import json
import time
from typing import Any, Callable

import fastapi
import packaging.version as pv
from fastapi import FastAPI, Request, Response
from fastapi.responses import HTMLResponse, StreamingResponse
from pyinstrument import Profiler
from pyinstrument.renderers.html import HTMLRenderer
from pyinstrument.renderers.speedscope import SpeedscopeRenderer
from starlette.middleware.base import BaseHTTPMiddleware

from src.core.config import Config
from src.log import get_root_logger


async def profile_request(request: Request, call_next: Callable):
    """
    Profile the current request

    Adapted from
    https://pyinstrument.readthedocs.io/en/latest/guide.html#profile-a-web-request-in-fastapi

    """
    profile_format = "html"
    check_interval = 0.001

    profile_type_to_renderer = {
        "html": HTMLRenderer,
        "speedscope": SpeedscopeRenderer,
    }

    if request.query_params.get("profile", False):
        # The default profile format is speedscope
        profile_type = request.query_params.get("profile_format", profile_format)

        # we profile the request along with all additional middlewares, by interrupting
        # the program every 1ms1 and records the entire stack at that point
        with Profiler(interval=check_interval, async_mode="enabled") as profiler:
            await call_next(request)

        renderer = profile_type_to_renderer[profile_type]()
        response_data = profiler.output(renderer=renderer)
        if profile_type == "html":
            return HTMLResponse(response_data)
        else:
            return StreamingResponse(iter(response_data))

    # Proceed without profiling
    return await call_next(request)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware in charge of logging the HTTP request and response

    Adapted from
    https://medium.com/@dhavalsavalia/fastapi-logging-middleware-logging-requests-and-responses-with-ease-and-style-201b9aa4001a

    """

    @staticmethod
    async def _set_body(request: Request, body: bytes):
        # Before FastAPI 0.108.0 infinite hang is expected,
        # if request body is awaited more than once.
        # It's not needed when using FastAPI >= 0.108.0.
        # https://github.com/tiangolo/fastapi/discussions/8187#discussioncomment-7962889
        if pv.parse(fastapi.__version__) >= pv.Version("0.108.0"):
            return

        async def receive():
            return {"type": "http.request", "body": body}

        request._receive = receive

    def __init__(self, app: FastAPI) -> None:
        super().__init__(app)
        self.logger = get_root_logger()

        self.max_displayed_body_size = 200

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        logging_dict: dict[str, Any] = {}

        body = await request.body()
        await self._set_body(request, body)

        response, response_dict = await self._log_response(call_next, request)
        request_dict = await self._log_request(request)
        logging_dict["request"] = request_dict
        logging_dict["response"] = response_dict

        request_id = request.headers.get("X-Request-ID")
        if request_id:
            logging_dict["correlation_id"] = request_id

        self.logger.info(json.dumps(logging_dict))
        return response

    async def _log_request(self, request: Request) -> dict[str, Any]:
        """
        Logs request part

        Arguments:
        - request: Request
        """

        path = request.url.path
        if request.query_params:
            path += f"?{request.query_params}"

        request_logging = {
            "method": request.method,
            "path": path,
            "ip": request.client.host if request.client is not None else None,
        }

        try:
            body = await request.body()
            await self._set_body(request, body)
        except Exception:
            body = None
        else:
            if body is not None:
                raw_body = False

                if len(body) < self.max_displayed_body_size:
                    try:
                        body = json.loads(body)
                    except (json.JSONDecodeError, TypeError):
                        raw_body = True
                else:
                    raw_body = True

                if raw_body:
                    body = body.decode(errors="ignore")
                    body = body[: self.max_displayed_body_size]

            request_logging["body"] = body

        return request_logging

    async def _log_response(
        self, call_next: Callable, request: Request
    ) -> tuple[Response, dict[str, Any]]:
        """
        Logs response part

        Arguments:
        - call_next: Callable (To execute the actual path function and get response back)
        - request: Request
        - request_id: str (uuid)

        Returns:
        - response: Response
        - response_logging: str
        """

        start_time = time.perf_counter()
        response = await self._execute_request(call_next, request)
        finish_time = time.perf_counter()
        execution_time = finish_time - start_time

        overall_status = "successful" if response.status_code < 400 else "failed"

        response_logging = {
            "status": overall_status,
            "status_code": response.status_code,
            "time_taken": f"{execution_time:0.4f}s",
        }
        return response, response_logging

    async def _execute_request(self, call_next: Callable, request: Request) -> Response:
        """
        Executes the actual path function using call_next.

        Arguments:
        - call_next: Callable (To execute the actual path function
                     and get response back)
        - request: Request
        - request_id: str (uuid)
        Returns:
        - response: Response
        """
        try:
            response: Response = await call_next(request)

        except Exception as e:
            self.logger.exception({"path": request.url.path, "method": request.method, "reason": e})
            raise e

        else:
            return response


def setup_middleware(app: FastAPI):
    if Config.features.request_logging_enabled:
        app.add_middleware(RequestLoggingMiddleware)

    if Config.features.profiling_enabled:
        app.add_middleware(BaseHTTPMiddleware, dispatch=profile_request)
