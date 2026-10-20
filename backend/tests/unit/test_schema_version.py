import logging

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, inspect, select, text

from app.core.config import Settings
from app.db.models import SCHEMA_VERSION, Prediction
from app.db.session import ensure_schema, init_db
from app.main import create_app


def user_version(engine) -> int:
    with engine.connect() as conn:
        return conn.exec_driver_sql("PRAGMA user_version").scalar_one()


def one_prediction(**overrides) -> Prediction:
    fields = {
        "source": "single",
        "type": "TRANSFER",
        "amount": 10.0,
        "probability": 0.5,
        "risk_level": "high",
        "payload": {},
        "model_version": "v",
        "model_hash": "abc",
    }
    return Prediction(**{**fields, **overrides})


@pytest.fixture
def db_file(tmp_path):
    return tmp_path / "fraud.db"


@pytest.fixture
def engines():
    """Engines a test opens; they are disposed afterwards so no SQLite connection is left open."""
    opened = []
    yield opened
    for engine in opened:
        engine.dispose()


@pytest.fixture
def open_db(db_file, engines):
    """`init_db` on the temporary file, remembering the engine for cleanup."""

    def factory():
        engine, session_factory = init_db(db_file)
        engines.append(engine)
        return engine, session_factory

    return factory


def test_a_new_database_is_stamped_with_the_current_version(open_db, caplog):
    with caplog.at_level(logging.WARNING, logger="app"):
        engine, _ = open_db()
    assert user_version(engine) == SCHEMA_VERSION
    assert "predictions" in inspect(engine).get_table_names()
    assert not caplog.records  # nothing to rebuild, so nothing to warn about


def test_a_database_at_the_current_version_keeps_its_rows(open_db):
    engine, Session = open_db()
    with Session() as session:
        session.add(one_prediction())
        session.commit()
    engine.dispose()

    engine, Session = open_db()
    with Session() as session:
        assert len(session.scalars(select(Prediction)).all()) == 1
    assert user_version(engine) == SCHEMA_VERSION


def test_an_older_version_is_dropped_and_rebuilt_with_a_warning(open_db, caplog):
    engine, Session = open_db()
    with Session() as session:
        session.add(one_prediction())
        session.commit()
    with engine.begin() as conn:
        conn.exec_driver_sql(f"PRAGMA user_version = {SCHEMA_VERSION - 1}")
    engine.dispose()

    with caplog.at_level(logging.WARNING, logger="app"):
        engine, Session = open_db()

    with Session() as session:
        assert session.scalars(select(Prediction)).all() == []
    assert user_version(engine) == SCHEMA_VERSION
    (record,) = caplog.records
    assert "event=schema_rebuilt" in record.getMessage()
    assert f"found={SCHEMA_VERSION - 1}" in record.getMessage()
    assert f"expected={SCHEMA_VERSION}" in record.getMessage()


def test_a_file_from_before_versioning_is_rebuilt_too(db_file, engines, caplog):
    # An old database: a predictions table without the newer columns and user_version 0.
    engine = create_engine(f"sqlite:///{db_file}")
    engines.append(engine)
    with engine.begin() as conn:
        conn.execute(text("CREATE TABLE predictions (id INTEGER PRIMARY KEY, probability FLOAT)"))
        conn.execute(text("INSERT INTO predictions (probability) VALUES (0.9)"))
    assert user_version(engine) == 0

    with caplog.at_level(logging.WARNING, logger="app"):
        ensure_schema(engine)

    columns = {c["name"] for c in inspect(engine).get_columns("predictions")}
    assert {"model_version", "model_hash", "request_id"} <= columns
    assert user_version(engine) == SCHEMA_VERSION
    assert "event=schema_rebuilt" in caplog.records[0].getMessage()


def test_a_newer_version_is_rebuilt_as_well(open_db):
    engine, _ = open_db()
    with engine.begin() as conn:
        conn.exec_driver_sql(f"PRAGMA user_version = {SCHEMA_VERSION + 5}")
    ensure_schema(engine)
    assert user_version(engine) == SCHEMA_VERSION


def test_the_app_rebuilds_an_outdated_database_on_startup(tmp_path, engines):
    db = tmp_path / "old.db"
    engine = create_engine(f"sqlite:///{db}")
    engines.append(engine)
    with engine.begin() as conn:
        conn.execute(text("CREATE TABLE predictions (id INTEGER PRIMARY KEY)"))

    with TestClient(create_app(Settings(_env_file=None, db_path=db))) as client:
        assert client.get("/api/v1/predictions").json() == []
        assert client.get("/api/v1/ready").status_code == 200
