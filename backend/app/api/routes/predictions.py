from datetime import datetime
from typing import Annotated, Literal

from fastapi import APIRouter, Path, Query

from app.api.deps import DbDep
from app.api.openapi import NOT_FOUND, VALIDATION_ERROR
from app.core.errors import NotFoundError
from app.db import repository
from app.schemas.common import Page, RiskLevel, Source
from app.schemas.predictions import PredictionRecord, StatsOut
from app.schemas.review import ReviewIn, ReviewStatus
from app.services import review_service

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
    review_status: Annotated[
        ReviewStatus | None, Query(description="Only this review status (`pending` is the queue)")
    ] = None,
    created_from: Annotated[
        datetime | None, Query(description="Created at or after this instant (naive = UTC)")
    ] = None,
    created_to: Annotated[
        datetime | None, Query(description="Created at or before this instant (naive = UTC)")
    ] = None,
    sort: Annotated[
        Literal["newest", "probability"],
        Query(description="`newest` (default) or `probability`, highest first"),
    ] = "newest",
):
    """One page of the prediction log, newest first (`created_at`, then `id`, descending).

    With `sort=probability` the highest scores come first instead, which is the order for working
    through the review queue (`review_status=pending`).

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
        review_status=review_status,
        created_from=created_from,
        created_to=created_to,
        sort=sort,
    )
    return Page(items=items, total=total, limit=limit, offset=offset)


# Declared before `/predictions/{prediction_id}` so "stats" is not read as an id.
@router.get("/predictions/stats", response_model=StatsOut, summary="Prediction counts")
def prediction_stats(db: DbDep):
    """Totals by risk level and by source (single request or batch), and the review statistics.

    `review` summarises what analysts have decided on this demo data. `observed_precision` is the
    share of reviewed, model-flagged predictions that turned out to be fraud. It is not a model
    metric: the model's test-set results are in the model card.
    """
    return {**repository.stats(db), "review": review_service.review_stats(db)}


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


@router.patch(
    "/predictions/{prediction_id}/review",
    response_model=PredictionRecord,
    summary="Review a prediction",
    responses={**NOT_FOUND, **VALIDATION_ERROR},
)
def review_prediction(
    prediction_id: Annotated[int, Path(ge=1, description="Prediction id")], body: ReviewIn, db: DbDep
):
    """Record an analyst's verdict: `confirmed_fraud`, `false_positive` or `legitimate`, with an
    optional note (500 characters at most).

    Predictions start as `pending` (high and review) or `legitimate` (low). A later review replaces
    the earlier one, including its note. Rules, each a 422 naming the field:

    - `pending` cannot be set; it is only the initial state.
    - A low-risk prediction was not flagged, so it cannot be a `false_positive`.
    - Confirming fraud on a low-risk prediction (a miss by the model) requires a note.
    """
    return review_service.review_prediction(db, prediction_id, body.status, body.note)


@router.delete("/predictions", summary="Clear the prediction log")
def clear_predictions(db: DbDep) -> dict:
    """Delete every stored prediction and every batch. The model is not affected."""
    predictions, batches = repository.clear(db)
    return {"deleted": predictions, "batches_deleted": batches}
