import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import Settings
from app.db.models import Base
from app.main import create_app
from app.ml.model import FraudModel

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


def upload(client, text: str, name: str = "batch.csv"):
    """POST a CSV given as text to the batch endpoint."""
    return client.post("/predict/batch", files={"file": (name, text.encode(), "text/csv")})


@pytest.fixture
def make_client(tmp_path, monkeypatch):
    """Start the app with env overrides and a fresh temporary SQLite file."""
    clients = []

    def factory(**env: str) -> TestClient:
        monkeypatch.setenv("DB_PATH", str(tmp_path / "test.db"))
        for key, value in env.items():
            monkeypatch.setenv(key, value)
        c = TestClient(create_app())
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
    settings = Settings()
    return FraudModel.load(settings.model_path, settings.model_version)


@pytest.fixture
def db_session():
    """A SQLAlchemy session on an in-memory SQLite database with the app's tables."""
    engine = create_engine("sqlite://", poolclass=StaticPool)
    Base.metadata.create_all(engine)
    with sessionmaker(engine, expire_on_commit=False)() as session:
        yield session
    engine.dispose()

