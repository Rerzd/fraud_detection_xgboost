"""Request and response models."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

TransactionType = Literal["TRANSFER", "CASH_OUT"]
RiskLevel = Literal["low", "review", "high"]


class TransactionIn(BaseModel):
    """A raw PaySim transaction. Derived features are computed by the backend."""

    type: TransactionType = Field(description="Only the two types the model was trained on")
    step: int = Field(ge=1, le=744, description="Simulation hour (1 step = 1 hour, 30 days)")
    amount: float = Field(gt=0)
    oldbalanceOrg: float = Field(ge=0, description="Origin balance before the transaction")
    newbalanceOrig: float = Field(ge=0, description="Origin balance after the transaction")
    oldbalanceDest: float = Field(ge=0, description="Destination balance before the transaction")
    newbalanceDest: float = Field(ge=0, description="Destination balance after the transaction")


class EngineeredFeatures(BaseModel):
    step: int
    type: int
    amount: float
    oldbalanceOrg: float | None
    newbalanceOrig: float | None
    oldbalanceDest: float
    newbalanceDest: float
    errorbalanceDest: float
    errorbalanceOrig: float | None


class Contribution(BaseModel):
    feature: str
    value: float | None
    contribution: float = Field(description="Log-odds contribution toward fraud")


class Explanation(BaseModel):
    base_value: float = Field(description="Model bias in log-odds")
    contributions: list[Contribution] = Field(description="Sorted by absolute contribution")


class PredictionOut(BaseModel):
    probability: float
    risk_level: RiskLevel
    is_fraud: bool
    threshold: float
    features: EngineeredFeatures
    explanation: Explanation
    signals: list[str] = Field(description="Descriptive rule observations, not model reasoning")


class ExampleOut(BaseModel):
    id: str
    label: RiskLevel
    description: str
    transaction: TransactionIn


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


class BatchOut(BaseModel):
    batch_id: str
    summary: BatchSummary
    rows: list[BatchRow]
    errors: list[BatchRowError]


class HistoryItem(BaseModel):
    id: int
    created_at: datetime
    source: Literal["single", "batch"]
    batch_id: str | None
    type: TransactionType
    amount: float
    probability: float
    risk_level: RiskLevel
    payload: dict

    model_config = {"from_attributes": True}


class StatsOut(BaseModel):
    total: int
    by_risk: dict[RiskLevel, int]
    by_source: dict[Literal["single", "batch"], int]


class HealthOut(BaseModel):
    status: str
    model_loaded: bool
    model_version: str | None
