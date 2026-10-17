"""Request and response models."""

from pydantic import BaseModel


class TransactionIn(BaseModel):
    step: int
    type: int
    amount: float
    oldbalanceOrg: float
    newbalanceOrig: float
    oldbalanceDest: float
    newbalanceDest: float
    errorbalanceDest: float
    errorbalanceOrig: float


class PredictionOut(BaseModel):
    fraud: bool
    probability: float


class HealthOut(BaseModel):
    status: str
    model_loaded: bool
    model_version: str | None
