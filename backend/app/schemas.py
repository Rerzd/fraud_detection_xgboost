"""Request and response models."""

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


class PredictionOut(BaseModel):
    probability: float
    risk_level: RiskLevel
    is_fraud: bool
    threshold: float
    features: EngineeredFeatures


class HealthOut(BaseModel):
    status: str
    model_loaded: bool
    model_version: str | None
