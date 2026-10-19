"""Single-transaction scoring: the raw input, the engineered features and the explained result."""

from pydantic import BaseModel, Field

from app.schemas.common import RiskLevel, TransactionType


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
