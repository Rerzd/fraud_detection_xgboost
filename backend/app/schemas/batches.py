"""Batch scoring: limits, per-row results and the run summary."""

from pydantic import BaseModel, Field

from app.schemas.common import RiskLevel
from app.schemas.scoring import TransactionIn


class BatchRow(TransactionIn):
    row: int = Field(description="CSV line number (header is line 1)")
    probability: float
    risk_level: RiskLevel


class BatchRowError(BaseModel):
    row: int
    reason: str


class BatchSummary(BaseModel):
    total: int
    scored: int
    invalid: int
    risk_counts: dict[RiskLevel, int]
    flagged_rate: float = Field(description="Share of scored rows at high risk")


class BatchLimits(BaseModel):
    max_rows: int
    max_bytes: int
    required_columns: list[str]


class BatchOut(BaseModel):
    batch_id: str
    summary: BatchSummary
    rows: list[BatchRow]
    errors: list[BatchRowError]
