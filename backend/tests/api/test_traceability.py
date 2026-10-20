"""Every score can be tied to the model artifact and to the request that produced it."""

from conftest import CSV_3_VALID_1_INVALID, NOTEBOOK_FRAUD_ROW, upload


def test_prediction_response_names_the_model(client, model):
    body = client.post("/api/v1/predict", json=NOTEBOOK_FRAUD_ROW).json()
    assert body["model_version"] == "xgb-paysim-v1"
    assert body["model_hash"] == model.sha256[:12]
    assert len(body["model_hash"]) == 12


def test_the_stored_row_has_the_model_and_the_request_id(client, model):
    sent = client.post(
        "/api/v1/predict", json=NOTEBOOK_FRAUD_ROW, headers={"X-Request-ID": "trace-1"}
    )
    (row,) = client.get("/api/v1/predictions").json()["items"]
    assert row["model_version"] == sent.json()["model_version"] == "xgb-paysim-v1"
    assert row["model_hash"] == model.sha256[:12]
    assert row["request_id"] == "trace-1" == sent.headers["X-Request-ID"]


def test_batch_rows_share_the_request_id_and_the_model(client, model):
    response = upload(client, CSV_3_VALID_1_INVALID)
    assert response.json()["model_version"] == "xgb-paysim-v1"
    assert response.json()["model_hash"] == model.sha256[:12]
    rows = client.get("/api/v1/predictions").json()["items"]
    assert len(rows) == 3
    assert {r["request_id"] for r in rows} == {response.headers["X-Request-ID"]}
    assert {r["model_hash"] for r in rows} == {model.sha256[:12]}


def test_model_card_carries_the_full_hash(client, model):
    card = client.get("/api/v1/model/info").json()
    assert card["sha256"] == model.sha256
    assert card["model_hash"] == model.sha256[:12]
    assert card["version"] == "xgb-paysim-v1"
