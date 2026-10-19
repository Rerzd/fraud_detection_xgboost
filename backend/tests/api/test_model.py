def test_model_info(client):
    card = client.get("/model/info").json()
    assert card["metrics"]["auprc"] == 0.9926
    assert card["algorithm"]["hyperparameters"]["max_depth"] == 3
    assert card["thresholds"] == {**card["thresholds"], "review": 0.2, "fraud": 0.5}
    assert [f["name"] for f in card["features"]][-1] == "errorbalanceOrig"
    assert "roc_auc" not in card["metrics"]
