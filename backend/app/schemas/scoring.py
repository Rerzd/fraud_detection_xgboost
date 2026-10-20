"""Single-transaction scoring: the raw input, the engineered features and the explained result."""

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import RiskLevel, TransactionType

NOTEBOOK_FRAUD_TRANSACTION = {
    "type": "TRANSFER",
    "step": 459,
    "amount": 1153156.0,
    "oldbalanceOrg": 1153156.0,
    "newbalanceOrig": 0.0,
    "oldbalanceDest": 0.0,
    "newbalanceDest": 0.0,
}


class TransactionIn(BaseModel):
    """A raw PaySim transaction. Derived features are computed by the backend."""

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [NOTEBOOK_FRAUD_TRANSACTION],
        }
    )

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


# What the API returns for NOTEBOOK_FRAUD_TRANSACTION (xgb-paysim-v1); digits rounded for display.
_PREDICTION_EXAMPLE = {
    "id": 1,
    "model_version": "xgb-paysim-v1",
    "model_hash": "cbf91feebec3",
    "probability": 0.99999988,
    "risk_level": "high",
    "is_fraud": True,
    "threshold": 0.5,
    "features": {
        "step": 459,
        "type": 0,
        "amount": 1153156.0,
        "oldbalanceOrg": 1153156.0,
        "newbalanceOrig": 0.0,
        "oldbalanceDest": -1.0,
        "newbalanceDest": -1.0,
        "errorbalanceDest": 1153156.0,
        "errorbalanceOrig": 0.0,
    },
    "explanation": {
        "base_value": -0.9363,
        "contributions": [
            {"feature": "oldbalanceDest", "value": -1.0, "contribution": 6.7795},
            {"feature": "errorbalanceOrig", "value": 0.0, "contribution": 6.6061},
            {"feature": "amount", "value": 1153156.0, "contribution": 1.7088},
            {"feature": "newbalanceOrig", "value": 0.0, "contribution": 1.4499},
            {"feature": "oldbalanceOrg", "value": 1153156.0, "contribution": 1.3876},
            {"feature": "type", "value": 0.0, "contribution": -1.1554},
            {"feature": "newbalanceDest", "value": -1.0, "contribution": 0.3912},
            {"feature": "errorbalanceDest", "value": 1153156.0, "contribution": -0.3657},
            {"feature": "step", "value": 459.0, "contribution": -0.1939},
        ],
    },
    "signals": [
        "Origin account fully drained (balance after is 0).",
        "Amount equals the full origin balance.",
        "Destination balances are 0 before and after despite a non-zero amount; "
        "sentinel -1 applied, as in training.",
    ],
}


class PredictionOut(BaseModel):
    model_config = ConfigDict(json_schema_extra={"examples": [_PREDICTION_EXAMPLE]})

    id: int = Field(description="Id of the stored prediction, see `/predictions/{id}`")
    model_version: str = Field(description="Configured label of the model that scored this")
    model_hash: str = Field(description="First 12 hex characters of the model file's sha256")
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
