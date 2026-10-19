"""Request tracing: a request id and a timing header on every response, one log line per request."""

import logging
import re
import time
import uuid

from starlette.datastructures import MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.core.logging import kv

REQUEST_ID_HEADER = "X-Request-ID"
PROCESS_TIME_HEADER = "X-Process-Time-Ms"

logger = logging.getLogger("app.request")

# Ids from clients are echoed into headers and logs, so only plain identifiers are accepted.
_VALID_ID = re.compile(r"^[A-Za-z0-9._-]{1,128}$")


def _request_id(scope: Scope) -> str:
    for name, value in scope["headers"]:
        if name == b"x-request-id":
            candidate = value.decode("latin-1")
            if _VALID_ID.match(candidate):
                return candidate
    return str(uuid.uuid4())


class RequestContextMiddleware:
    """Accept or create `X-Request-ID`, expose it on `request.state.request_id`, time the request."""

    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request_id = _request_id(scope)
        scope.setdefault("state", {})["request_id"] = request_id
        started = time.perf_counter()
        status = 500  # what the client gets if the app raises before answering

        async def send_with_headers(message: Message) -> None:
            nonlocal status
            if message["type"] == "http.response.start":
                status = message["status"]
                headers = MutableHeaders(scope=message)
                headers[REQUEST_ID_HEADER] = request_id
                headers[PROCESS_TIME_HEADER] = f"{(time.perf_counter() - started) * 1000:.2f}"
            await send(message)

        try:
            await self.app(scope, receive, send_with_headers)
        finally:
            logger.info(
                kv(
                    method=scope["method"],
                    path=scope["path"],
                    status=status,
                    duration_ms=f"{(time.perf_counter() - started) * 1000:.2f}",
                    request_id=request_id,
                )
            )
