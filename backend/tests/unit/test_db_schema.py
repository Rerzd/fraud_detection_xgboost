import pytest
from sqlalchemy import inspect
from sqlalchemy.exc import IntegrityError

from app.db.models import Batch
from app.db.session import init_db
from conftest import make_prediction


@pytest.fixture
def db(tmp_path):
    engine, Session = init_db(tmp_path / "fraud.db")
    yield engine, Session
    engine.dispose()


def indexed_columns(engine, table: str) -> set[str]:
    return {col for index in inspect(engine).get_indexes(table) for col in index["column_names"]}


def test_the_columns_the_log_is_filtered_and_sorted_by_are_indexed(db):
    engine, _ = db
    assert {"created_at", "risk_level", "batch_id", "review_status"} <= indexed_columns(
        engine, "predictions"
    )
    assert "created_at" in indexed_columns(engine, "batches")


def test_a_prediction_cannot_point_at_a_batch_that_does_not_exist(db):
    _, Session = db
    orphan = make_prediction(source="batch", batch_id="f" * 32)
    with Session() as session, pytest.raises(IntegrityError):
        session.add(orphan)
        session.commit()


def test_a_prediction_can_point_at_an_existing_batch(db):
    _, Session = db
    with Session() as session:
        session.add(
            Batch(
                id="a" * 32,
                filename=None,
                total_rows=1,
                scored=1,
                invalid=0,
                flagged=0,
                model_version="v",
                model_hash="abc",
            )
        )
        session.add(make_prediction(source="batch", batch_id="a" * 32))
        session.commit()
