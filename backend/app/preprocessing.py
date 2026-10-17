"""Turn raw transactions into the feature frame the model was trained on.

Replicates the notebook (`fraud_detection_2.ipynb`) exactly, in this order:
  a) destination balances both 0 while amount != 0 -> both become -1
  b) origin balances both 0 while amount != 0      -> both become NaN
  c) error balances computed after a) and b) (NaN propagates)
"""

from collections.abc import Iterable, Mapping

import numpy as np
import pandas as pd

TYPE_CODES = {"TRANSFER": 0, "CASH_OUT": 1}

FEATURE_ORDER = [
    "step",
    "type",
    "amount",
    "oldbalanceOrg",
    "newbalanceOrig",
    "oldbalanceDest",
    "newbalanceDest",
    "errorbalanceDest",
    "errorbalanceOrig",
]

DEST_SENTINEL = -1.0


def build_features(transactions: Iterable[Mapping]) -> pd.DataFrame:
    """Raw transactions (type as "TRANSFER"/"CASH_OUT") -> model features in training order."""
    df = pd.DataFrame(list(transactions))
    df["type"] = df["type"].map(TYPE_CODES)
    for col in ("amount", "oldbalanceOrg", "newbalanceOrig", "oldbalanceDest", "newbalanceDest"):
        df[col] = df[col].astype(float)

    dest_empty = (df.oldbalanceDest == 0) & (df.newbalanceDest == 0) & (df.amount != 0)
    df.loc[dest_empty, ["oldbalanceDest", "newbalanceDest"]] = DEST_SENTINEL

    orig_empty = (df.oldbalanceOrg == 0) & (df.newbalanceOrig == 0) & (df.amount != 0)
    df.loc[orig_empty, ["oldbalanceOrg", "newbalanceOrig"]] = np.nan

    df["errorbalanceDest"] = df.oldbalanceDest + df.amount - df.newbalanceDest
    df["errorbalanceOrig"] = df.newbalanceOrig + df.amount - df.oldbalanceOrg

    return df[FEATURE_ORDER]


def features_to_dict(row: pd.Series) -> dict[str, float | int | None]:
    """One feature row as JSON-safe values (NaN -> None)."""
    out: dict[str, float | int | None] = {}
    for name in FEATURE_ORDER:
        value = row[name]
        if pd.isna(value):
            out[name] = None
        elif name in ("step", "type"):
            out[name] = int(value)
        else:
            out[name] = float(value)
    return out
