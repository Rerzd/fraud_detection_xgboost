from conftest import NOTEBOOK_FRAUD_ROW

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
    return client.post("/predict/batch", files={"file": (name, text.encode(), "text/csv")})


def test_predict_persists_one_row(client):
    client.post("/predict", json=NOTEBOOK_FRAUD_ROW)
    history = client.get("/predictions").json()
    assert len(history) == 1
    assert history[0]["source"] == "single"
    assert history[0]["risk_level"] == "high"
    assert history[0]["payload"] == NOTEBOOK_FRAUD_ROW


def test_batch_scores_valid_rows_and_reports_errors(client):
    body = upload(client, CSV_3_VALID_1_INVALID).json()
    summary = body["summary"]
    assert summary["total"] == 4
    assert summary["scored"] == 3
    assert summary["invalid"] == 1
    assert summary["risk_counts"] == {"high": 1, "review": 1, "low": 1}
    assert summary["flagged_rate"] == 1 / 3
    assert body["errors"] == [{"row": 4, "reason": body["errors"][0]["reason"]}]
    assert body["errors"][0]["reason"].startswith("type:")
    probabilities = [r["probability"] for r in body["rows"]]
    assert probabilities == sorted(probabilities, reverse=True)

    history = client.get("/predictions").json()
    assert len(history) == 3
    assert {h["source"] for h in history} == {"batch"}
    assert {h["batch_id"] for h in history} == {body["batch_id"]}


def test_stats_are_correct(client):
    client.post("/predict", json=NOTEBOOK_FRAUD_ROW)
    upload(client, CSV_3_VALID_1_INVALID)
    stats = client.get("/predictions/stats").json()
    assert stats == {
        "total": 4,
        "by_risk": {"low": 1, "review": 1, "high": 2},
        "by_source": {"single": 1, "batch": 3},
    }


def test_history_filter_and_clear(client):
    upload(client, CSV_3_VALID_1_INVALID)
    high = client.get("/predictions", params={"risk_level": "high"}).json()
    assert [h["risk_level"] for h in high] == ["high"]
    assert client.delete("/predictions").json() == {"deleted": 3}
    assert client.get("/predictions").json() == []


def test_batch_missing_columns_is_rejected(client):
    response = upload(client, "type,step,amount\nTRANSFER,1,100")
    assert response.status_code == 422
    assert "Missing required columns" in response.json()["detail"]


def test_batch_row_limit(make_client):
    response = upload(make_client(BATCH_MAX_ROWS="2"), CSV_3_VALID_1_INVALID)
    assert response.status_code == 422
    assert "Too many rows" in response.json()["detail"]


def test_batch_size_limit(make_client):
    response = upload(make_client(BATCH_MAX_BYTES="50"), CSV_3_VALID_1_INVALID)
    assert response.status_code == 413


def test_batch_limits_come_from_config(make_client):
    body = make_client(BATCH_MAX_ROWS="123").get("/predict/batch/limits").json()
    assert body["max_rows"] == 123
    assert body["max_bytes"] == 5 * 1024 * 1024
    assert body["required_columns"] == HEADER.split(",")
