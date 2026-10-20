from fastapi import APIRouter

from app.api.deps import ModelDep, SettingsDep
from app.api.openapi import MODEL_UNAVAILABLE
from app.ml.model_card import build_model_card

router = APIRouter(tags=["model"])


@router.get("/model/info", summary="Model card", responses=MODEL_UNAVAILABLE)
def model_info(model: ModelDep, settings: SettingsDep) -> dict:
    """Training setup, notebook metrics, decision thresholds, features and known limitations.

    Metrics are copied from the training notebook's printed output; ROC-AUC is not reported
    because the notebook never printed it.
    """
    return build_model_card(model, settings)
