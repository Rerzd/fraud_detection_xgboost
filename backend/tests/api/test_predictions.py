from conftest import CSV_3_VALID_1_INVALID, NOTEBOOK_FRAUD_ROW, upload


def test_predict_persists_one_row(client):
    client.post("/predict", json=NOTEBOOK_FRAUD_ROW)
    history = client.get("/predictions").json()
    assert len(history) == 1
    assert history[0]["source"] == "single"
    assert history[0]["risk_level"] == "high"
    assert history[0]["payload"] == NOTEBOOK_FRAUD_ROW


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
