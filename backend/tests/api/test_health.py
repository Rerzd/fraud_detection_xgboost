def test_health_reports_model_loaded(client):
    body = client.get("/health").json()
    assert body == {"status": "ok", "model_loaded": True, "model_version": "xgb-paysim-v1"}
