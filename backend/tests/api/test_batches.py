from conftest import CSV_3_VALID_1_INVALID, HEADER, upload


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
