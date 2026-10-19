from typing import Annotated

from fastapi import APIRouter, Query

from app.api.deps import DbDep
from app.db import repository
from app.schemas.common import RiskLevel
from app.schemas.predictions import HistoryItem, StatsOut

router = APIRouter(tags=["predictions"])


@router.get("/predictions", response_model=list[HistoryItem])
def list_predictions(
    db: DbDep,
    limit: Annotated[int, Query(ge=1, le=500)] = 50,
    risk_level: RiskLevel | None = None,
):
    return repository.list_recent(db, limit, risk_level)


@router.get("/predictions/stats", response_model=StatsOut)
def prediction_stats(db: DbDep):
    return repository.stats(db)


@router.delete("/predictions")
def clear_predictions(db: DbDep) -> dict:
    return {"deleted": repository.clear(db)}
