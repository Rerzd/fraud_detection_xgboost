from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Path, Query

from app.api.deps import DbDep
from app.api.openapi import NOT_FOUND, VALIDATION_ERROR
from app.core.errors import NotFoundError
from app.db import repository
from app.schemas.common import Page, RiskLevel, Source
from app.schemas.predictions import PredictionRecord, StatsOut

router = APIRouter(tags=["predictions"])

MAX_PAGE_SIZE = 200


@router.get(
    "/predictions",
    response_model=Page[PredictionRecord],
    summary="List stored predictions",
    responses=VALIDATION_ERROR,
)
def list_predictions(
    db: DbDep,
    limit: Annotated[int, Query(ge=1, le=MAX_PAGE_SIZE, description="Page size")] = 50,
    offset: Annotated[int, Query(ge=0, description="Records to skip")] = 0,
    risk_level: Annotated[RiskLevel | None, Query(description="Only this risk level")] = None,
    source: Annotated[Source | None, Query(description="Single request or batch row")] = None,
    batch_id: Annotated[str | None, Query(description="Only the rows of this batch")] = None,
    created_from: Annotated[
        datetime | None, Query(description="Created at or after this instant (naive = UTC)")
    ] = None,
    created_to: Annotated[
        datetime | None, Query(description="Created at or before this instant (naive = UTC)")
    ] = None,
):
    """One page of the prediction log, newest first (`created_at`, then `id`, descending).

    `total` counts every record matching the filters, so `offset + len(items) < total` means there
    is a next page. Each item includes the stored request payload.
    """
    items, total = repository.list_predictions(
        db,
        limit=limit,
        offset=offset,
        risk_level=risk_level,
        source=source,
        batch_id=batch_id,
        created_from=created_from,
        created_to=created_to,
    )
    return Page(items=items, total=total, limit=limit, offset=offset)


# Declared before `/predictions/{prediction_id}` so "stats" is not read as an id.
@router.get("/predictions/stats", response_model=StatsOut, summary="Prediction counts")
def prediction_stats(db: DbDep):
    """Totals by risk level and by source (single request or batch)."""
    return repository.stats(db)


@router.get(
    "/predictions/{prediction_id}",
    response_model=PredictionRecord,
    summary="Get one stored prediction",
    responses={**NOT_FOUND, **VALIDATION_ERROR},
)
def get_prediction(prediction_id: Annotated[int, Path(ge=1, description="Prediction id")], db: DbDep):
    """The stored record: submitted payload, score, model that produced it and request id."""
    record = repository.get_prediction(db, prediction_id)
    if record is None:
        raise NotFoundError(f"Prediction {prediction_id} not found.")
    return record


@router.delete("/predictions", summary="Clear the prediction log")
def clear_predictions(db: DbDep) -> dict:
    """Delete every stored prediction and every batch. The model is not affected."""
    predictions, batches = repository.clear(db)
    return {"deleted": predictions, "batches_deleted": batches}
