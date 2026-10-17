import math

from app.preprocessing import FEATURE_ORDER, build_features

BASE = {
    "type": "CASH_OUT",
    "step": 10,
    "amount": 100.0,
    "oldbalanceOrg": 500.0,
    "newbalanceOrig": 400.0,
    "oldbalanceDest": 1000.0,
    "newbalanceDest": 1100.0,
}


def build_one(**overrides):
    return build_features([{**BASE, **overrides}]).iloc[0]


def test_column_order_matches_training():
    assert list(build_features([BASE]).columns) == FEATURE_ORDER


def test_type_is_encoded():
    assert build_one(type="TRANSFER")["type"] == 0
    assert build_one(type="CASH_OUT")["type"] == 1


def test_destination_zero_zero_becomes_sentinel():
    row = build_one(oldbalanceDest=0.0, newbalanceDest=0.0)
    assert row.oldbalanceDest == -1 and row.newbalanceDest == -1
    # computed after the sentinel: -1 + amount - (-1)
    assert row.errorbalanceDest == 100.0


def test_origin_zero_zero_becomes_nan_and_propagates():
    row = build_one(oldbalanceOrg=0.0, newbalanceOrig=0.0)
    assert math.isnan(row.oldbalanceOrg) and math.isnan(row.newbalanceOrig)
    assert math.isnan(row.errorbalanceOrig)


def test_error_balance_formulas():
    row = build_one()
    assert row.errorbalanceDest == 1000.0 + 100.0 - 1100.0
    assert row.errorbalanceOrig == 400.0 + 100.0 - 500.0


def test_untouched_balances_when_not_both_zero():
    row = build_one(oldbalanceDest=0.0, newbalanceDest=100.0)
    assert row.oldbalanceDest == 0 and row.newbalanceDest == 100.0
