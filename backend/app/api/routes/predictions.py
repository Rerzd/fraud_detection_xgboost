from typing import Annotated

from fastapi import APIRouter, Query

from app.api.deps import DbDep
from app.api.openapi import VALIDATION_ERROR
from app.db import repository
from app.schemas.common import RiskLevel
from app.schemas.predictions import HistoryItem, StatsOut

router = APIRouter(tags=["predictions"])


@router.get(
    "/predictions",
    response_model=list[HistoryItem],
    summary="List stored predictions",
    responses=VALIDATION_ERROR,
)
def list_predictions(
    db: DbDep,
    limit: Annotated[int, Query(ge=1, le=500, description="Maximum number of items")] = 50,
    risk_level: Annotated[RiskLevel | None, Query(description="Only this risk level")] = None,
):
    """Newest first. Includes the stored request payload of every prediction."""
    return repository.list_recent(db, limit, risk_level)


@router.get("/predictions/stats", response_model=StatsOut, summary="Prediction counts")
def prediction_stats(db: DbDep):
    """Totals by risk level and by source (single request or batch)."""
    return repository.stats(db)


@router.delete("/predictions", summary="Clear the prediction log")
def clear_predictions(db: DbDep) -> dict:
    """Delete every stored prediction. The model is not affected."""
    return {"deleted": repository.clear(db)}
