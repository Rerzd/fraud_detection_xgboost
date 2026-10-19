"""Model loading and scoring."""

import warnings
from pathlib import Path

import joblib
import pandas as pd
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
