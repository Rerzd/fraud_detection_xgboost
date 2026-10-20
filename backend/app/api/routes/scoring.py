from fastapi import APIRouter

from app.api.deps import DbDep, ModelDep, SettingsDep
from app.api.openapi import MODEL_UNAVAILABLE, VALIDATION_ERROR
from app.ml.examples import EXAMPLES
from app.schemas.scoring import ExampleOut, PredictionOut, TransactionIn
from app.services import scoring_service

router = APIRouter(tags=["scoring"])


@router.post(
    "/predict",
    response_model=PredictionOut,
    summary="Score one transaction",
    responses={**VALIDATION_ERROR, **MODEL_UNAVAILABLE},
)
def predict(tx: TransactionIn, model: ModelDep, settings: SettingsDep, db: DbDep):
    """Score a raw PaySim transaction and store the result in the prediction log.

    The backend applies the training preprocessing (sentinel values for empty accounts and the two
    error-balance features), so send the six raw fields. `explanation` gives each feature's
    contribution in log-odds; the contributions plus `base_value` equal the model's raw score.
    `signals` are plain rule observations about the input, not model reasoning.
    """
    return scoring_service.score_transaction(tx, model, settings, db)


@router.get("/examples", response_model=list[ExampleOut], summary="Sample transactions")
def examples() -> list[dict]:
    """Ready-made transactions, one or more per risk level. Each one scores to its `label`."""
    return EXAMPLES
