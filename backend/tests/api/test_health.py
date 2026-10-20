import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from conftest import assert_envelope


def test_health_reports_the_loaded_model(client, model):
    body = client.get("/api/v1/health").json()
    assert body == {
        "status": "ok",
        "model_loaded": True,
        "model_version": "xgb-paysim-v1",
        "model_hash": model.sha256[:12],
    }


def test_health_stays_up_without_a_model(client):
    client.app.state.model = None
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "model_loaded": False,
        "model_version": None,
        "model_hash": None,
    }


def test_ready_when_the_model_and_the_database_work(client):
    response = client.get("/api/v1/ready")
    assert response.status_code == 200
    assert response.json() == {"status": "ready", "checks": {"model": "ok", "database": "ok"}}


def test_not_ready_without_a_model(client):
    client.app.state.model = None
    error = assert_envelope(client.get("/api/v1/ready"), 503, "NOT_READY")
    assert error["details"] == [{"field": "model", "message": "The model artifact is not loaded."}]


def test_not_ready_when_the_database_fails(client):
    broken = create_engine("sqlite:////nonexistent-dir/fraud.db")
    client.app.state.sessionmaker = sessionmaker(broken)
    error = assert_envelope(client.get("/api/v1/ready"), 503, "NOT_READY")
    assert [d["field"] for d in error["details"]] == ["database"]


def test_not_ready_names_every_failing_check(client):
    client.app.state.model = None
    client.app.state.sessionmaker = sessionmaker(create_engine("sqlite:////nonexistent-dir/fraud.db"))
    error = assert_envelope(client.get("/api/v1/ready"), 503, "NOT_READY")
    assert [d["field"] for d in error["details"]] == ["model", "database"]


@pytest.mark.parametrize("path", ["/health", "/ready", "/predict", "/predictions", "/model/info"])
def test_unversioned_paths_no_longer_exist(client, path):
    assert_envelope(client.get(path), 404, "NOT_FOUND")


def test_every_documented_endpoint_is_under_the_version_prefix(client):
    paths = client.get("/openapi.json").json()["paths"]
    assert paths and all(p.startswith("/api/v1/") for p in paths)

