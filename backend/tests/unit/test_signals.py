from app.ml.signals import describe

CONSISTENT = {
    "type": "CASH_OUT",
    "step": 120,
    "amount": 18500.0,
    "oldbalanceOrg": 42300.0,
    "newbalanceOrig": 23800.0,
    "oldbalanceDest": 150000.0,
    "newbalanceDest": 168500.0,
}


def text(**overrides) -> str:
    return " ".join(describe({**CONSISTENT, **overrides}))


def test_consistent_transaction_has_no_signals():
    assert describe(CONSISTENT) == []


def test_full_drain_is_reported_twice_over():
    signals = text(amount=42300.0, newbalanceOrig=0.0, newbalanceDest=192300.0)
    assert "fully drained" in signals
    assert "full origin balance" in signals


def test_empty_origin_is_described_as_missing():
    signals = text(oldbalanceOrg=0.0, newbalanceOrig=0.0)
    assert "treated as missing (NaN)" in signals
    assert "Origin balance does not reconcile" not in signals


def test_empty_destination_gets_the_sentinel_note():
    signals = text(oldbalanceDest=0.0, newbalanceDest=0.0)
    assert "sentinel -1" in signals
    assert "Destination balance does not reconcile" not in signals


def test_unreconciled_balances_report_the_gap():
    assert "gap 500.00" in text(newbalanceOrig=24300.0)
    assert "gap -1,000.00" in text(newbalanceDest=169500.0)


def test_rounding_within_a_cent_is_not_a_gap():
    assert describe({**CONSISTENT, "newbalanceOrig": 23800.004}) == []
