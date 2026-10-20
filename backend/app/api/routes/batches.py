from typing import Annotated

from fastapi import APIRouter, Path, Query, UploadFile

from app.api.deps import DbDep, ModelDep, RequestIdDep, SettingsDep
from app.api.openapi import BATCH_ERRORS, MODEL_UNAVAILABLE, NOT_FOUND, VALIDATION_ERROR
from app.core.errors import NotFoundError
from app.db import repository
from app.schemas.batches import BatchLimits, BatchOut, BatchRecord
from app.schemas.common import Page
from app.services import batch_service

router = APIRouter(tags=["batches"])


@router.get("/predict/batch/limits", response_model=BatchLimits, summary="Batch upload limits")
def batch_limits(settings: SettingsDep) -> BatchLimits:
    """Maximum rows and bytes per file, and the columns the CSV must have."""
    return BatchLimits(
        max_rows=settings.batch_max_rows,
        max_bytes=settings.batch_max_bytes,
        required_columns=batch_service.REQUIRED_COLUMNS,
    )


@router.post(
    "/predict/batch",
    response_model=BatchOut,
    summary="Score a CSV of transactions",
    responses={**BATCH_ERRORS, **MODEL_UNAVAILABLE},
)
def predict_batch(
    file: UploadFile, model: ModelDep, settings: SettingsDep, db: DbDep, request_id: RequestIdDep
):
    """Upload a CSV (multipart field `file`) with the columns from `/predict/batch/limits`.

    Valid rows are scored and stored; invalid rows are not, and come back in `errors` with their
    CSV line number (the header is line 1). Rows in the response are sorted by probability. The
    run itself is recorded as a batch (`/batches`) and its rows carry its `batch_id`.
    """
    content = file.file.read(settings.batch_max_bytes + 1)
    return batch_service.score_batch(content, model, settings, db, request_id, file.filename)


@router.get(
    "/batches",
    response_model=Page[BatchRecord],
    summary="List previous batch runs",
    responses=VALIDATION_ERROR,
)
def list_batches(
    db: DbDep,
    limit: Annotated[int, Query(ge=1, le=200, description="Page size")] = 50,
    offset: Annotated[int, Query(ge=0, description="Records to skip")] = 0,
):
    """One page of uploaded batches, newest first. Fetch a batch's rows with
    `/predictions?batch_id=...`."""
    items, total = repository.list_batches(db, limit=limit, offset=offset)
    return Page(items=items, total=total, limit=limit, offset=offset)


@router.get(
    "/batches/{batch_id}",
    response_model=BatchRecord,
    summary="Get one batch run",
    responses={**NOT_FOUND, **VALIDATION_ERROR},
)
def get_batch(
    batch_id: Annotated[
        str, Path(pattern=r"^[0-9a-f]{32}$", description="Batch id from `POST /predict/batch`")
    ],
    db: DbDep,
):
    """Counts, file name and model of one uploaded batch."""
    batch = repository.get_batch(db, batch_id)
    if batch is None:
        raise NotFoundError(f"Batch {batch_id} not found.")
    return batch
