"""Types and models shared by several routers."""

from typing import Literal

from pydantic import BaseModel

TransactionType = Literal["TRANSFER", "CASH_OUT"]
RiskLevel = Literal["low", "review", "high"]


class HealthOut(BaseModel):
    status: str
    model_loaded: bool
    model_version: str | None
