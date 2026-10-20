from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import Settings
from app.db.models import Base, Prediction
from app.main import create_app
from app.ml.model import FraudModel
from app.schemas.common import ErrorResponse

# The notebook's known fraud row (Xtest index 6020168) in raw, pre-preprocessing form.
NOTEBOOK_FRAUD_ROW = {
    "type": "TRANSFER",
    "step": 459,
    "amount": 1153156.0,
    "oldbalanceOrg": 1153156.0,
    "newbalanceOrig": 0.0,
    "oldbalanceDest": 0.0,
    "newbalanceDest": 0.0,
}


HEADER = "type,step,amount,oldbalanceOrg,newbalanceOrig,oldbalanceDest,newbalanceDest"
CSV_3_VALID_1_INVALID = "\n".join(
    [
        HEADER,
        "TRANSFER,459,1153156,1153156,0,0,0",
        "CASH_OUT,120,18500,42300,23800,150000,168500",
        "PAYMENT,10,100,500,400,0,100",
        "TRANSFER,350,400000,800000,400000,0,0",
    ]
)


def make_prediction(**overrides) -> Prediction:
    """A stored-prediction row with plausible defaults, for tests that write to the database."""
    fields = {
        "created_at": datetime(2026, 1, 1, 12, 0, 0, tzinfo=UTC),
        "source": "single",
        "batch_id": None,
        "type": "TRANSFER",
        "amount": 10.0,
        "probability": 0.9,
        "risk_level": "high",
        "payload": {},
        "model_version": "xgb-paysim-v1",
        "model_hash": "cbf91feebec3",
        "request_id": None,
        "review_status": "pending",
    }
    return Prediction(**{**fields, **overrides})


def csv_of(valid_rows: int) -> str:
    """A CSV with this many valid rows (the same ordinary cash-out each time)."""
    return "\n".join([HEADER, *["CASH_OUT,120,18500,42300,23800,150000,168500"] * valid_rows])


def upload(client, text: str, name: str = "batch.csv"):
    """POST a CSV given as text to the batch endpoint."""
    return client.post("/api/v1/predict/batch", files={"file": (name, text.encode(), "text/csv")})


def assert_envelope(response, status: int, code: str) -> dict:
    """The body must match the documented error schema exactly and carry the request id."""
    assert response.status_code == status
    body = ErrorResponse.model_validate(response.json())
    assert body.error.code == code
    assert body.error.request_id == response.headers["X-Request-ID"]
    return response.json()["error"]


@pytest.fixture
def make_client(tmp_path):
    """Start the app with explicit settings and a fresh temporary SQLite file.

    Overrides are `Settings` fields, e.g. `make_client(batch_max_rows=2)`. `.env` is ignored so a
    developer's local file cannot change test results.
    """
    clients = []

    def factory(**overrides) -> TestClient:
        settings = Settings(_env_file=None, db_path=tmp_path / "test.db", **overrides)
        c = TestClient(create_app(settings))
        c.__enter__()
        clients.append(c)
        return c

    yield factory
    for c in clients:
        c.__exit__(None, None, None)


@pytest.fixture
def client(make_client):
    return make_client()


@pytest.fixture(scope="session")
def model() -> FraudModel:
    """The real model artifact, loaded once for the whole run."""
    settings = Settings(_env_file=None)
    return FraudModel.load(settings.model_path, settings.model_version)


@pytest.fixture
def db_session():
    """A SQLAlchemy session on an in-memory SQLite database with the app's tables."""
    engine = create_engine("sqlite://", poolclass=StaticPool)
    Base.metadata.create_all(engine)
    with sessionmaker(engine, expire_on_commit=False)() as session:
        yield session
    engine.dispose()
