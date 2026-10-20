"""Stored predictions and store-wide statistics."""

from pydantic import BaseModel, Field

from app.schemas.common import RiskLevel, Source, TransactionType, UtcDatetime


class PredictionRecord(BaseModel):
    """A stored prediction: the raw request, the score and where it came from."""

    id: int
    created_at: UtcDatetime = Field(description="UTC")
    source: Source
    batch_id: str | None = Field(description="The batch the row came from; null for single requests")
    type: TransactionType
    amount: float
    probability: float
    risk_level: RiskLevel
    payload: dict = Field(description="The transaction exactly as it was submitted")
    model_version: str
    model_hash: str
    request_id: str | None = Field(description="`X-Request-ID` of the call that stored it")

    model_config = {"from_attributes": True}


class StatsOut(BaseModel):
    total: int
    by_risk: dict[RiskLevel, int]
    by_source: dict[Source, int]
