"""Model card served by GET /model/info.

Metrics are copied from the printed outputs of backend/fraud_detection_2.ipynb.
ROC-AUC was computed in the notebook but never printed, so it is not reported.
"""

from app.core.config import Settings
from app.ml.model import FraudModel

FEATURE_DESCRIPTIONS = {
    "step": "Simulation hour (1 step = 1 hour over 30 days); not a real timestamp.",
    "type": "Transaction type, encoded TRANSFER = 0, CASH_OUT = 1.",
    "amount": "Transaction amount.",
    "oldbalanceOrg": "Origin balance before; NaN when origin is 0 before and after.",
    "newbalanceOrig": "Origin balance after; NaN when origin is 0 before and after.",
    "oldbalanceDest": "Destination balance before; -1 when destination is 0 before and after.",
    "newbalanceDest": "Destination balance after; -1 when destination is 0 before and after.",
    "errorbalanceDest": "oldbalanceDest + amount - newbalanceDest (computed after the sentinel rules).",
    "errorbalanceOrig": "newbalanceOrig + amount - oldbalanceOrg (NaN propagates).",
}


def build_model_card(model: FraudModel, settings: Settings) -> dict:
    clf = model.pipeline[-1]
    params = clf.get_params()
    return {
        "name": "PaySim fraud classifier",
        "version": model.version,
        "sha256": model.sha256,
        "model_hash": model.short_hash,
        "algorithm": {
            "estimator": type(clf).__name__,
            "objective": params["objective"],
            "hyperparameters": {
                "max_depth": params["max_depth"],
                "n_estimators": clf.get_booster().num_boosted_rounds(),
                "scale_pos_weight": round(float(params["scale_pos_weight"]), 2),
                "missing": "NaN",
            },
        },
        "training_data": {
            "dataset": "PaySim (synthetic mobile-money transactions)",
            "total_rows": 6362620,
            "filter": "Only TRANSFER and CASH_OUT, the only types where fraud occurs",
            "rows_after_filter": {"TRANSFER": 532909, "CASH_OUT": 2237500},
            "split": "80/20 train/test, random_state=5",
            "class_weighting": "scale_pos_weight = negatives / positives",
        },
        "metrics": {
            "test_rows": 554082,
            "test_frauds": 1670,
            "auprc": 0.9926,
            "fraud_class_at_0_5": {"precision": 0.85, "recall": 1.00, "f1": 0.92},
        },
        "thresholds": {
            "review": settings.review_threshold,
            "fraud": settings.fraud_threshold,
            "levels": {
                "low": f"probability < {settings.review_threshold}: approve",
                "review": f"{settings.review_threshold} <= probability < {settings.fraud_threshold}: "
                "send to manual review",
                "high": f"probability >= {settings.fraud_threshold}: flag for fraud "
                "(the threshold used in the notebook evaluation)",
            },
        },
        "features": [{"name": n, "description": d} for n, d in FEATURE_DESCRIPTIONS.items()],
        "limitations": [
            "Trained on synthetic data (PaySim); real-world performance is unknown.",
            "Only TRANSFER and CASH_OUT are supported; other types are rejected.",
            "`step` is simulation time, so it carries no meaning outside PaySim.",
            "scale_pos_weight shifts scores upward; probabilities are not calibrated.",
            "Metrics come from a single random split with no separate validation set.",
        ],
    }
