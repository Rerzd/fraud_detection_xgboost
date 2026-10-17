import pytest
from fastapi.testclient import TestClient

from app.main import app

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


@pytest.fixture
def make_client(tmp_path, monkeypatch):
    """Start the app with env overrides and a fresh temporary SQLite file."""
    clients = []

    def factory(**env: str) -> TestClient:
        monkeypatch.setenv("DB_PATH", str(tmp_path / "test.db"))
        for key, value in env.items():
            monkeypatch.setenv(key, value)
        c = TestClient(app)
        c.__enter__()
        clients.append(c)
        return c

    yield factory
    for c in clients:
        c.__exit__(None, None, None)


@pytest.fixture
def client(make_client):
    return make_client()
