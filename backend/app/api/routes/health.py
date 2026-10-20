from fastapi import APIRouter, Request

from app.schemas.common import HealthOut

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthOut, summary="Liveness and model status")
def health(request: Request) -> HealthOut:
    """Answers as long as the process is up. `model_loaded` tells whether scoring is possible."""
    model = request.app.state.model
    return HealthOut(
        status="ok",
        model_loaded=model is not None,
        model_version=model.version if model else None,
    )
