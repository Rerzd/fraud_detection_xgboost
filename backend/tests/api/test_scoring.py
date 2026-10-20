from conftest import NOTEBOOK_FRAUD_ROW


def test_notebook_fraud_row_is_high_risk(client):
    body = client.post("/api/v1/predict", json=NOTEBOOK_FRAUD_ROW).json()
    assert body["risk_level"] == "high"
    assert body["is_fraud"] is True
    assert body["probability"] > 0.99
    assert body["threshold"] == 0.5
    features = body["features"]
    assert features["oldbalanceDest"] == -1 and features["newbalanceDest"] == -1
    assert features["errorbalanceDest"] == 1153156.0
    assert features["errorbalanceOrig"] == 0.0


def test_origin_nan_is_serialized_as_null(client):
    tx = {**NOTEBOOK_FRAUD_ROW, "oldbalanceOrg": 0.0, "newbalanceOrig": 0.0}
    features = client.post("/api/v1/predict", json=tx).json()["features"]
    assert features["oldbalanceOrg"] is None
    assert features["errorbalanceOrig"] is None


def test_unsupported_type_is_rejected(client):
    response = client.post("/api/v1/predict", json={**NOTEBOOK_FRAUD_ROW, "type": "PAYMENT"})
    assert response.status_code == 422


def test_zero_amount_is_rejected(client):
    response = client.post("/api/v1/predict", json={**NOTEBOOK_FRAUD_ROW, "amount": 0})
    assert response.status_code == 422


def test_the_response_carries_the_id_of_the_stored_prediction(client):
    first = client.post("/api/v1/predict", json=NOTEBOOK_FRAUD_ROW).json()
    second = client.post("/api/v1/predict", json=NOTEBOOK_FRAUD_ROW).json()
    assert second["id"] == first["id"] + 1
    stored = client.get(f"/api/v1/predictions/{first['id']}").json()
    assert stored["probability"] == first["probability"]


def test_step_out_of_range_is_rejected(client):
    response = client.post("/api/v1/predict", json={**NOTEBOOK_FRAUD_ROW, "step": 745})
    assert response.status_code == 422


def test_model_not_loaded_returns_503(client):
    model = client.app.state.model
    client.app.state.model = None
    try:
        assert client.post("/api/v1/predict", json=NOTEBOOK_FRAUD_ROW).status_code == 503
        assert client.get("/api/v1/health").json()["model_loaded"] is False
    finally:
        client.app.state.model = model
