import logging
import re
import uuid

from conftest import NOTEBOOK_FRAUD_ROW


def test_every_response_has_a_request_id_and_timing(client):
    response = client.get("/health")
    uuid.UUID(response.headers["X-Request-ID"], version=4)
    assert float(response.headers["X-Process-Time-Ms"]) >= 0


def test_incoming_request_id_is_echoed(client):
    response = client.get("/health", headers={"X-Request-ID": "trace-abc.123_x"})
    assert response.headers["X-Request-ID"] == "trace-abc.123_x"


def test_each_request_without_an_id_gets_its_own(client):
    ids = {client.get("/health").headers["X-Request-ID"] for _ in range(3)}
    assert len(ids) == 3


def test_malformed_incoming_ids_are_replaced(client):
    for bad in ["has space", "x" * 129, "semi;colon", "new\tline"]:
        returned = client.get("/health", headers={"X-Request-ID": bad}).headers["X-Request-ID"]
        assert returned != bad
        uuid.UUID(returned, version=4)


def test_headers_are_present_on_errors_too(client):
    not_found = client.get("/nope", headers={"X-Request-ID": "r-404"})
    assert not_found.status_code == 404 and not_found.headers["X-Request-ID"] == "r-404"
    invalid = client.post("/predict", json={**NOTEBOOK_FRAUD_ROW, "amount": 0}, headers={"X-Request-ID": "r-422"})
    assert invalid.status_code == 422 and invalid.headers["X-Request-ID"] == "r-422"


def test_headers_are_exposed_to_browsers(client):
    response = client.get(
        "/health", headers={"Origin": "http://localhost:5173"}
    )
    exposed = response.headers["access-control-expose-headers"]
    assert "X-Request-ID" in exposed and "X-Process-Time-Ms" in exposed


def test_one_log_line_per_request(client, caplog):
    with caplog.at_level(logging.INFO, logger="app.request"):
        client.post("/predict", json=NOTEBOOK_FRAUD_ROW, headers={"X-Request-ID": "log-me"})
    lines = [r.getMessage() for r in caplog.records if r.name == "app.request"]
    assert len(lines) == 1
    assert re.fullmatch(
        r"method=POST path=/predict status=200 duration_ms=\d+\.\d{2} request_id=log-me", lines[0]
    )


def test_log_line_has_the_error_status_and_no_query_string(client, caplog):
    with caplog.at_level(logging.INFO, logger="app.request"):
        client.get("/predictions", params={"limit": 0, "secret": "token"})
    (line,) = [r.getMessage() for r in caplog.records if r.name == "app.request"]
    assert "status=422" in line and "path=/predictions " in line and "secret" not in line


def test_startup_logs_the_model_artifact(make_client, caplog):
    with caplog.at_level(logging.INFO, logger="app.main"):
        make_client()
    text = " ".join(r.getMessage() for r in caplog.records)
    assert "event=model_loaded" in text
    assert "version=xgb-paysim-v1" in text
    assert re.search(r"sha256=[0-9a-f]{64}", text)
    assert "fraud_model.pkl" in text
