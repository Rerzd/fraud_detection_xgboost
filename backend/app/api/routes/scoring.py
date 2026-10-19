from fastapi import APIRouter

from app.api.deps import DbDep, ModelDep, SettingsDep
from app.ml.examples import EXAMPLES
from app.schemas.scoring import ExampleOut, PredictionOut, TransactionIn
from app.services import scoring_service

router = APIRouter(tags=["scoring"])


@router.post("/predict", response_model=PredictionOut)
def predict(tx: TransactionIn, model: ModelDep, settings: SettingsDep, db: DbDep):
    return scoring_service.score_transaction(tx, model, settings, db)


@router.get("/examples", response_model=list[ExampleOut])
def examples() -> list[dict]:
    return EXAMPLES
