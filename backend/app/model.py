"""Model loading and scoring."""

import warnings
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.exceptions import InconsistentVersionWarning
from sklearn.pipeline import Pipeline


def risk_level(probability: float, review_threshold: float, fraud_threshold: float) -> str:
    """low < review_threshold <= review < fraud_threshold <= high."""
    if probability >= fraud_threshold:
        return "high"
    if probability >= review_threshold:
        return "review"
    return "low"


class FraudModel:
    def __init__(self, pipeline: Pipeline, version: str):
        self.pipeline = pipeline
        self.version = version

    @classmethod
    def load(cls, path: Path, version: str) -> "FraudModel":
        # The pickle was written by scikit-learn 1.6.1. The Pipeline only wraps the
        # XGBClassifier (no transformers), so loading it with 1.8.0 is safe.
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", InconsistentVersionWarning)
            pipeline = joblib.load(path)
        return cls(pipeline, version)

    def predict_proba(self, features: pd.DataFrame) -> list[float]:
        """Probability of the fraud class for each row."""
        return [float(p) for p in self.pipeline.predict_proba(features)[:, 1]]

    def explain(self, features: pd.DataFrame) -> dict:
        """Per-feature contributions (log-odds) for the first row, via XGBoost pred_contribs.

        sum(contributions) + base_value == logit(probability).
        """
        X = features
        if len(self.pipeline.steps) > 1:
            X = self.pipeline[:-1].transform(features)
        names = list(features.columns)
        booster = self.pipeline[-1].get_booster()
        contribs = booster.predict(
            xgb.DMatrix(np.asarray(X, dtype=float), feature_names=names, missing=np.nan),
            pred_contribs=True,
        )[0]
        row = features.iloc[0]
        items = [
            {
                "feature": name,
                "value": None if pd.isna(row[name]) else float(row[name]),
                "contribution": float(contribs[i]),
            }
            for i, name in enumerate(names)
        ]
        items.sort(key=lambda item: abs(item["contribution"]), reverse=True)
        return {"base_value": float(contribs[-1]), "contributions": items}
