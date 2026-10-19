"""Per-feature explanations from XGBoost's own `pred_contribs`."""

import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.pipeline import Pipeline


def explain(pipeline: Pipeline, features: pd.DataFrame) -> dict:
    """Per-feature contributions (log-odds) for the first row.

    sum(contributions) + base_value == logit(probability). The last column XGBoost returns is the
    bias term.
    """
    X = features
    if len(pipeline.steps) > 1:
        X = pipeline[:-1].transform(features)
    names = list(features.columns)
    booster = pipeline[-1].get_booster()
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
