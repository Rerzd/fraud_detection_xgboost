from fastapi.testclient import TestClient

from app.main import app


def test_health_reports_model_loaded():
    with TestClient(app) as client:
        body = client.get("/health").json()
    assert body["status"] == "ok"
    assert body["model_loaded"] is True
