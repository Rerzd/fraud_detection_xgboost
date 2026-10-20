from fastapi import APIRouter

from app.api.deps import DbDep, OptionalModelDep
from app.api.openapi import NOT_READY
from app.core.errors import NotReadyError
from app.schemas.common import HealthOut, ReadyOut
from app.services import health_service

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthOut, summary="Liveness")
def health(model: OptionalModelDep) -> HealthOut:
    """Answers as long as the process is up, even without a model.

    Use it to know the process runs; use `/ready` to know it can serve. `model_hash` is the short
    sha256 of the model file, so the answer says which artifact is loaded.
    """
    return HealthOut(
        status="ok",
        model_loaded=model is not None,
        model_version=model.version if model else None,
        model_hash=model.short_hash if model else None,
    )


@router.get("/ready", response_model=ReadyOut, summary="Readiness", responses=NOT_READY)
def ready(model: OptionalModelDep, db: DbDep) -> ReadyOut:
    """Ready when the model is loaded and the database answers a `SELECT 1`; otherwise 503.

    The error `details` name each failing check. Container healthchecks and load balancers should
    use this endpoint, not `/health`.
    """
    failures = health_service.readiness_failures(model, db)
    if failures:
        raise NotReadyError("The service is not ready.", failures)
    return ReadyOut(status="ready", checks={"model": "ok", "database": "ok"})
