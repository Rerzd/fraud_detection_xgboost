import logging

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.core.errors import (
    AppError,
    BatchTooLargeError,
    ConflictError,
    InvalidCsvError,
    ModelUnavailableError,
    NotFoundError,
    NotReadyError,
    RuleViolationError,
)
from app.main import create_app
from conftest import CSV_3_VALID_1_INVALID, NOTEBOOK_FRAUD_ROW, assert_envelope, upload


def test_validation_error_lists_each_field(client):
    bad = {**NOTEBOOK_FRAUD_ROW, "amount": 0, "type": "PAYMENT"}
    error = assert_envelope(client.post("/api/v1/predict", json=bad), 422, "VALIDATION_ERROR")
    fields = {d["field"]: d["message"] for d in error["details"]}
    assert set(fields) == {"amount", "type"}
    assert fields["amount"] == "Input should be greater than 0"
    assert error["message"] == "; ".join(f"{d['field']}: {d['message']}" for d in error["details"])


def test_missing_field_and_nested_location(client):
    body = {k: v for k, v in NOTEBOOK_FRAUD_ROW.items() if k != "step"}
    error = assert_envelope(client.post("/api/v1/predict", json=body), 422, "VALIDATION_ERROR")
    assert error["details"] == [{"field": "step", "message": "Field required"}]


def test_query_parameter_errors_name_the_parameter(client):
    error = assert_envelope(
        client.get("/api/v1/predictions", params={"limit": 0}), 422, "VALIDATION_ERROR"
    )
    assert error["details"][0]["field"] == "limit"


def test_a_body_that_is_not_json_is_a_validation_error(client):
    response = client.post(
        "/api/v1/predict", content=b"{not json", headers={"Content-Type": "application/json"}
    )
    error = assert_envelope(response, 422, "VALIDATION_ERROR")
    assert error["details"][0]["field"] == "body"


def test_missing_upload_is_a_validation_error(client):
    error = assert_envelope(client.post("/api/v1/predict/batch"), 422, "VALIDATION_ERROR")
    assert error["details"] == [{"field": "file", "message": "Field required"}]


def test_unknown_route_is_a_404_envelope(client):
    error = assert_envelope(client.get("/does-not-exist"), 404, "NOT_FOUND")
    assert error["message"] == "No route for GET /does-not-exist."
    assert error["details"] is None


def test_wrong_method_is_an_envelope_too(client):
    error = assert_envelope(client.put("/api/v1/health"), 405, "NOT_FOUND")
    assert "not allowed" in error["message"]


def test_model_not_loaded_is_503_model_unavailable(client):
    client.app.state.model = None
    for response in (
        client.post("/api/v1/predict", json=NOTEBOOK_FRAUD_ROW),
        client.get("/api/v1/model/info"),
        upload(client, CSV_3_VALID_1_INVALID),
    ):
        assert_envelope(response, 503, "MODEL_UNAVAILABLE")


def test_batch_file_problems_have_their_own_codes(client, make_client):
    assert_envelope(upload(client, "type,step\nTRANSFER,1"), 422, "INVALID_CSV")
    assert_envelope(upload(client, ""), 422, "INVALID_CSV")
    assert_envelope(
        upload(make_client(batch_max_rows=1), CSV_3_VALID_1_INVALID), 413, "BATCH_TOO_LARGE"
    )
    assert_envelope(
        upload(make_client(batch_max_bytes=20), CSV_3_VALID_1_INVALID), 413, "BATCH_TOO_LARGE"
    )


def test_the_incoming_request_id_ends_up_in_the_body(client):
    response = client.get("/nope", headers={"X-Request-ID": "trace-me"})
    assert response.json()["error"]["request_id"] == "trace-me"


@pytest.mark.parametrize(
    ("error", "status", "code"),
    [
        (NotFoundError, 404, "NOT_FOUND"),
        (ModelUnavailableError, 503, "MODEL_UNAVAILABLE"),
        (NotReadyError, 503, "NOT_READY"),
        (RuleViolationError, 422, "VALIDATION_ERROR"),
        (BatchTooLargeError, 413, "BATCH_TOO_LARGE"),
        (InvalidCsvError, 422, "INVALID_CSV"),
        (ConflictError, 409, "CONFLICT"),
    ],
)
def test_every_app_error_maps_to_its_status_and_code(tmp_path, error, status, code):
    app = create_app(Settings(_env_file=None, db_path=tmp_path / "t.db"))

    @app.get("/boom")
    def boom():
        raise error("it went wrong", [{"field": "x", "message": "bad"}])

    with TestClient(app) as c:
        body = assert_envelope(c.get("/boom"), status, code)
    assert body["message"] == "it went wrong"
    assert body["details"] == [{"field": "x", "message": "bad"}]


@pytest.mark.parametrize(
    ("status", "code"),
    [(400, "VALIDATION_ERROR"), (401, "VALIDATION_ERROR"), (502, "INTERNAL_ERROR")],
)
def test_a_stray_http_exception_still_gets_the_envelope(tmp_path, status, code):
    app = create_app(Settings(_env_file=None, db_path=tmp_path / "t.db"))

    @app.get("/stray")
    def stray():
        raise HTTPException(status_code=status, detail="plain detail", headers={"X-Extra": "kept"})

    with TestClient(app) as c:
        response = c.get("/stray")
    error = assert_envelope(response, status, code)
    assert error["message"] == "plain detail"
    assert response.headers["X-Extra"] == "kept"  # headers an exception carries are preserved


def test_app_error_subclasses_cover_the_documented_codes():
    codes = {cls.code for cls in AppError.__subclasses__()}
    assert codes == {
        "NOT_FOUND",
        "MODEL_UNAVAILABLE",
        "NOT_READY",
        "VALIDATION_ERROR",
        "BATCH_TOO_LARGE",
        "INVALID_CSV",
        "CONFLICT",
    }


def test_unhandled_exception_is_a_generic_500_that_is_logged(tmp_path, caplog):
    app = create_app(Settings(_env_file=None, db_path=tmp_path / "t.db"))

    @app.get("/crash")
    def crash():
        raise RuntimeError("database password is hunter2")

    with TestClient(app, raise_server_exceptions=False) as c:
        with caplog.at_level(logging.ERROR, logger="app.errors"):
            response = c.get("/crash", headers={"X-Request-ID": "crash-1"})

    error = assert_envelope(response, 500, "INTERNAL_ERROR")
    assert error["message"] == "Internal server error."
    assert error["request_id"] == "crash-1"
    # nothing about the failure leaks to the client ...
    assert "hunter2" not in response.text and "Traceback" not in response.text
    # ... but the log has the id and the traceback
    (record,) = [r for r in caplog.records if r.name == "app.errors"]
    assert "request_id=crash-1" in record.getMessage()
    assert "hunter2" in caplog.text and "Traceback" in caplog.text


def test_successful_responses_are_not_wrapped(client):
    assert "error" not in client.get("/api/v1/health").json()
