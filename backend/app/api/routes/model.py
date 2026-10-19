from fastapi import APIRouter

from app.api.deps import ModelDep, SettingsDep
from app.ml.model_card import build_model_card

router = APIRouter(tags=["model"])


@router.get("/model/info")
def model_info(model: ModelDep, settings: SettingsDep) -> dict:
    return build_model_card(model, settings)
