"""One error contract for the whole API.

Every error response has the same body, whatever raised it:

    {"error": {"code": "NOT_FOUND", "message": "...", "details": null, "request_id": "..."}}

Services and routes raise an `AppError` subclass; the handlers registered here also turn FastAPI's
validation errors, Starlette's routing errors and any unhandled exception into the same envelope.
"""

import logging
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.logging import kv
from app.core.middleware import REQUEST_ID_HEADER

logger = logging.getLogger("app.errors")


class AppError(Exception):
    """Base class: a failure the API reports with a given status and code."""

    status_code = 500
    code = "INTERNAL_ERROR"

    def __init__(self, message: str, details: list[dict[str, Any]] | None = None):
        super().__init__(message)
        self.message = message
        self.details = details


class NotFoundError(AppError):
    status_code = 404
    code = "NOT_FOUND"


class ModelUnavailableError(AppError):
    """The model artifact could not be loaded, so nothing can be scored."""

    status_code = 503
    code = "MODEL_UNAVAILABLE"


class BatchTooLargeError(AppError):
    """An uploaded file has more bytes or more rows than the configured limits."""

    status_code = 413
    code = "BATCH_TOO_LARGE"


class InvalidCsvError(AppError):
    """An uploaded file cannot be read as the expected CSV."""

    status_code = 422
    code = "INVALID_CSV"


class ConflictError(AppError):
    """The request is valid but clashes with the current state of the resource."""

    status_code = 409
    code = "CONFLICT"


# Where a FastAPI validation error points: the part of the request, then the field path.
_LOCATIONS = {"body", "query", "path", "header", "cookie"}


def _field(loc: tuple) -> str:
    parts = [str(p) for p in loc]
    if parts and parts[0] in _LOCATIONS:
        parts = parts[1:]
    if not parts or parts[0].isdigit():  # e.g. a body that is not JSON at all
        return "body"
    return ".".join(parts)


def _code_for_status(status: int) -> str:
    if status == 404 or status == 405:
        return "NOT_FOUND"
    return "VALIDATION_ERROR" if status < 500 else "INTERNAL_ERROR"


def error_response(
    request: Request,
    status: int,
    code: str,
    message: str,
    details: list[dict[str, Any]] | None = None,
    headers: dict[str, str] | None = None,
) -> JSONResponse:
    request_id = getattr(request.state, "request_id", "unknown")
    return JSONResponse(
        status_code=status,
        content={
            "error": {"code": code, "message": message, "details": details, "request_id": request_id}
        },
        headers={**(headers or {}), REQUEST_ID_HEADER: request_id},
    )


async def _app_error(request: Request, exc: AppError) -> JSONResponse:
    return error_response(request, exc.status_code, exc.code, exc.message, exc.details)


async def _validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
    details = [{"field": _field(e["loc"]), "message": e["msg"]} for e in exc.errors()]
    message = "; ".join(f"{d['field']}: {d['message']}" for d in details)
    return error_response(request, 422, "VALIDATION_ERROR", message, details)


async def _http_error(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    if exc.status_code == 404:
        message = f"No route for {request.method} {request.url.path}."
    elif exc.status_code == 405:
        message = f"{request.method} is not allowed on {request.url.path}."
    else:
        message = str(exc.detail)
    code = _code_for_status(exc.status_code)
    return error_response(request, exc.status_code, code, message, headers=dict(exc.headers or {}))


async def _unhandled(request: Request, exc: Exception) -> JSONResponse:
    # The traceback goes to the log, tagged with the request id; the client only gets the id.
    logger.error(
        kv(
            event="unhandled_exception",
            method=request.method,
            path=request.url.path,
            request_id=getattr(request.state, "request_id", "unknown"),
        ),
        exc_info=exc,
    )
    return error_response(request, 500, "INTERNAL_ERROR", "Internal server error.")


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppError, _app_error)
    app.add_exception_handler(RequestValidationError, _validation_error)
    app.add_exception_handler(StarletteHTTPException, _http_error)
    app.add_exception_handler(Exception, _unhandled)
