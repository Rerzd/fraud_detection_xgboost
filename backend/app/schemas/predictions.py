"""Stored predictions: history items and store-wide statistics."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel

from app.schemas.common import RiskLevel, TransactionType


class HistoryItem(BaseModel):
    id: int
    created_at: datetime
    source: Literal["single", "batch"]
    batch_id: str | None
    type: TransactionType
    amount: float
    probability: float
    risk_level: RiskLevel
    payload: dict

    model_config = {"from_attributes": True}


class StatsOut(BaseModel):
    total: int
    by_risk: dict[RiskLevel, int]
    by_source: dict[Literal["single", "batch"], int]
