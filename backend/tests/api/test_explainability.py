import math

import pytest

from app.ml.examples import EXAMPLES
from conftest import NOTEBOOK_FRAUD_ROW


def logit(p: float) -> float:
    return math.log(p / (1 - p))


@pytest.mark.parametrize("example", EXAMPLES, ids=[e["id"] for e in EXAMPLES])
def test_contributions_add_up_to_logit(client, example):
    body = client.post("/api/v1/predict", json=example["transaction"]).json()
    explanation = body["explanation"]
    total = explanation["base_value"] + sum(c["contribution"] for c in explanation["contributions"])
    # float32 probabilities saturate near 1, so compare in probability space there
    if body["probability"] > 0.9999:
        assert 1 / (1 + math.exp(-total)) == pytest.approx(body["probability"], abs=1e-6)
    else:
        assert total == pytest.approx(logit(body["probability"]), abs=1e-3)


def test_contributions_sorted_by_magnitude(client):
    contributions = client.post("/api/v1/predict", json=NOTEBOOK_FRAUD_ROW).json()["explanation"]["contributions"]
    magnitudes = [abs(c["contribution"]) for c in contributions]
    assert magnitudes == sorted(magnitudes, reverse=True)
    assert len(contributions) == 9


@pytest.mark.parametrize("example", EXAMPLES, ids=[e["id"] for e in EXAMPLES])
def test_every_example_scores_to_its_label(client, example):
    body = client.post("/api/v1/predict", json=example["transaction"]).json()
    assert body["risk_level"] == example["label"]


def test_examples_cover_all_risk_levels(client):
    labels = {e["label"] for e in client.get("/api/v1/examples").json()}
    assert labels == {"low", "review", "high"}


def test_signals_describe_the_fraud_row(client):
    signals = client.post("/api/v1/predict", json=NOTEBOOK_FRAUD_ROW).json()["signals"]
    text = " ".join(signals)
    assert "fully drained" in text
    assert "full origin balance" in text
    assert "sentinel -1" in text


def test_consistent_transaction_has_no_discrepancy_signal(client):
    tx = next(e for e in EXAMPLES if e["id"] == "consistent-cashout")["transaction"]
    signals = client.post("/api/v1/predict", json=tx).json()["signals"]
    assert not any("reconcile" in s for s in signals)
