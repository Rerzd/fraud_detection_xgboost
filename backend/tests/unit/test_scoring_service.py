from sqlalchemy import select

from app.core.config import Settings
from app.db.models import Prediction
from app.schemas.scoring import TransactionIn
from app.services.scoring_service import score_transaction
from conftest import NOTEBOOK_FRAUD_ROW


def test_scores_explains_and_persists_one_row(model, db_session):
    result = score_transaction(
        TransactionIn(**NOTEBOOK_FRAUD_ROW), model, Settings(_env_file=None), db_session
    )

    assert result.risk_level == "high" and result.is_fraud
    assert len(result.explanation.contributions) == 9
    assert result.signals

    (stored,) = db_session.scalars(select(Prediction)).all()
    assert stored.source == "single" and stored.batch_id is None
    assert stored.probability == result.probability
    assert stored.payload == NOTEBOOK_FRAUD_ROW


def test_thresholds_come_from_settings_not_from_the_service(model, db_session):
    tx = TransactionIn(**NOTEBOOK_FRAUD_ROW)
    strict = Settings(_env_file=None, review_threshold=0.2, fraud_threshold=0.9999999999)
    result = score_transaction(tx, model, strict, db_session)
    assert result.risk_level == "review" and not result.is_fraud
    assert result.threshold == 0.9999999999
