"""Score one transaction: preprocess, predict, explain, describe and persist."""

from sqlalchemy.orm import Session

from app.core.config import Settings
from app.db import repository
from app.ml.explain import explain
from app.ml.model import FraudModel, risk_level
from app.ml.preprocessing import build_features, features_to_dict
from app.ml.signals import describe
from app.schemas.scoring import PredictionOut, TransactionIn


def score_transaction(
    tx: TransactionIn,
    model: FraudModel,
    settings: Settings,
    session: Session,
    request_id: str | None = None,
) -> PredictionOut:
    """Validation already happened at the API boundary (`TransactionIn`)."""
    raw = tx.model_dump()
    features = build_features([raw])
    probability = model.predict_proba(features)[0]
    level = risk_level(probability, settings.review_threshold, settings.fraud_threshold)
    record = repository.insert(
        session,
        raw,
        probability,
        level,
        model_version=model.version,
        model_hash=model.short_hash,
        request_id=request_id,
    )
    return PredictionOut(
        id=record.id,
        model_version=model.version,
        model_hash=model.short_hash,
        probability=probability,
        risk_level=level,
        is_fraud=level == "high",
        threshold=settings.fraud_threshold,
        features=features_to_dict(features.iloc[0]),
        explanation=explain(model.pipeline, features),
        signals=describe(raw),
    )
