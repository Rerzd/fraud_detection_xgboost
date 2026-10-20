"""Types and models shared by several routers."""

from typing import Literal

from pydantic import BaseModel, Field

TransactionType = Literal["TRANSFER", "CASH_OUT"]
RiskLevel = Literal["low", "review", "high"]


class HealthOut(BaseModel):
    status: str
    model_loaded: bool
    model_version: str | None = Field(description="Configured label of the loaded model")
    model_hash: str | None = Field(description="First 12 hex characters of the model file's sha256")


class ReadyOut(BaseModel):
    status: Literal["ready"]
    checks: dict[str, str] = Field(description="Result of each dependency check")


ErrorCode = Literal[
    "VALIDATION_ERROR",
    "NOT_FOUND",
    "MODEL_UNAVAILABLE",
    "NOT_READY",
    "BATCH_TOO_LARGE",
    "INVALID_CSV",
    "CONFLICT",
    "INTERNAL_ERROR",
]


class ErrorDetail(BaseModel):
    field: str | None = Field(default=None, description="The input that is wrong, e.g. `amount`")
    message: str


class ErrorBody(BaseModel):
    code: ErrorCode = Field(description="Stable, machine-readable error code")
    message: str = Field(description="Human-readable summary, safe to show to a user")
    details: list[ErrorDetail] | None = Field(
        default=None, description="Per-field problems for validation errors, otherwise null"
    )
    request_id: str = Field(description="Same value as the `X-Request-ID` response header")


class ErrorResponse(BaseModel):
    """Every error response, whatever its status, has this shape."""

    error: ErrorBody
