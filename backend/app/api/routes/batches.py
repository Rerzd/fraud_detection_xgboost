from fastapi import APIRouter, UploadFile

from app.api.deps import DbDep, ModelDep, SettingsDep
from app.api.openapi import BATCH_ERRORS, MODEL_UNAVAILABLE
from app.schemas.batches import BatchLimits, BatchOut
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
def predict_batch(file: UploadFile, model: ModelDep, settings: SettingsDep, db: DbDep):
    """Upload a CSV (multipart field `file`) with the columns from `/predict/batch/limits`.

    Valid rows are scored and stored; invalid rows are not, and come back in `errors` with their
    CSV line number (the header is line 1). Rows in the response are sorted by probability.
    """
    content = file.file.read(settings.batch_max_bytes + 1)
    return batch_service.score_batch(content, model, settings, db)
