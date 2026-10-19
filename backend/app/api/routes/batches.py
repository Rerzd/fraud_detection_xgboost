from fastapi import APIRouter, HTTPException, UploadFile

from app.api.deps import DbDep, ModelDep, SettingsDep
from app.schemas.batches import BatchLimits, BatchOut
from app.services import batch_service
from app.services.batch_service import BatchError, BatchTooLargeError

router = APIRouter(tags=["batches"])


@router.get("/predict/batch/limits", response_model=BatchLimits)
def batch_limits(settings: SettingsDep) -> BatchLimits:
    return BatchLimits(
        max_rows=settings.batch_max_rows,
        max_bytes=settings.batch_max_bytes,
        required_columns=batch_service.REQUIRED_COLUMNS,
    )


@router.post("/predict/batch", response_model=BatchOut)
def predict_batch(file: UploadFile, model: ModelDep, settings: SettingsDep, db: DbDep):
    content = file.file.read(settings.batch_max_bytes + 1)
    try:
        return batch_service.score_batch(content, model, settings, db)
    except BatchTooLargeError as exc:
        raise HTTPException(status_code=413, detail=str(exc)) from exc
    except BatchError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
