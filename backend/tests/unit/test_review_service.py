import pytest
from app.core.errors import NotFoundError, RuleViolationError
from app.db.models import Prediction
from app.services.review_service import (
    check_review,
    initial_status,
    observed_precision,
    review_prediction,
    review_stats,
)
from conftest import make_prediction


def stored(session, **overrides) -> Prediction:
    record = make_prediction(**overrides)
    session.add(record)
    session.commit()
    return record


@pytest.mark.parametrize(
    ("level", "status"), [("high", "pending"), ("review", "pending"), ("low", "legitimate")]
)
def test_records_start_in_the_status_their_risk_level_implies(level, status):
    assert initial_status(level) == status


@pytest.mark.parametrize("level", ["high", "review", "low"])
def test_pending_can_never_be_set(level):
    with pytest.raises(RuleViolationError) as caught:
        check_review(level, "pending", "a note")
    assert caught.value.details == [{"field": "status", "message": caught.value.details[0]["message"]}]
    assert "initial state" in caught.value.message


def test_a_low_risk_prediction_cannot_be_a_false_positive():
    with pytest.raises(RuleViolationError, match="not flagged"):
        check_review("low", "false_positive", "note")


@pytest.mark.parametrize("note", [None, ""])
def test_confirming_fraud_on_a_low_risk_prediction_needs_a_note(note):
    with pytest.raises(RuleViolationError) as caught:
        check_review("low", "confirmed_fraud", note)
    assert [d["field"] for d in caught.value.details] == ["note"]


@pytest.mark.parametrize(
    ("level", "status", "note"),
    [
        ("low", "confirmed_fraud", "customer reported it"),
        ("low", "legitimate", None),
        ("review", "confirmed_fraud", None),
        ("review", "false_positive", None),
        ("review", "legitimate", None),
        ("high", "confirmed_fraud", None),
        ("high", "false_positive", None),
        ("high", "legitimate", "known payee"),
    ],
)
def test_every_other_verdict_is_allowed(level, status, note):
    check_review(level, status, note)


def test_a_review_stores_status_note_and_time(db_session):
    record = stored(db_session)
    result = review_prediction(db_session, record.id, "confirmed_fraud", "  drained account  ")
    assert result.review_status == "confirmed_fraud"
    assert result.review_note == "drained account"  # trimmed
    assert result.reviewed_at is not None


def test_a_blank_note_is_stored_as_no_note(db_session):
    record = stored(db_session)
    assert review_prediction(db_session, record.id, "legitimate", "   ").review_note is None


def test_a_second_review_overwrites_the_first_completely(db_session):
    record = stored(db_session)
    first = review_prediction(db_session, record.id, "false_positive", "looked odd")
    first_time = first.reviewed_at
    second = review_prediction(db_session, record.id, "confirmed_fraud", None)
    assert second.review_status == "confirmed_fraud"
    assert second.review_note is None  # the earlier note does not linger
    assert second.reviewed_at > first_time


def test_a_rejected_review_changes_nothing(db_session):
    record = stored(db_session, risk_level="low", review_status="legitimate")
    with pytest.raises(RuleViolationError):
        review_prediction(db_session, record.id, "confirmed_fraud", None)
    db_session.refresh(record)
    assert (record.review_status, record.review_note, record.reviewed_at) == ("legitimate", None, None)


def test_reviewing_an_unknown_prediction_is_not_found(db_session):
    with pytest.raises(NotFoundError, match="Prediction 42 not found"):
        review_prediction(db_session, 42, "legitimate", None)


@pytest.mark.parametrize(
    ("confirmed", "false_positives", "expected"),
    [(0, 0, None), (3, 0, 1.0), (0, 2, 0.0), (3, 1, 0.75), (1, 3, 0.25)],
)
def test_observed_precision(confirmed, false_positives, expected):
    assert observed_precision(confirmed, false_positives) == expected


def test_stats_of_an_empty_log(db_session):
    stats = review_stats(db_session)
    assert stats.model_dump() == {
        "pending": 0,
        "reviewed": 0,
        "confirmed_fraud": 0,
        "false_positive": 0,
        "missed_by_model": 0,
        "observed_precision": None,
    }


def test_stats_count_the_queue_and_the_verdicts(db_session):
    queue = [stored(db_session) for _ in range(2)]  # high, pending
    stored(db_session, risk_level="low", review_status="legitimate")  # never looked at
    for status in ("confirmed_fraud", "confirmed_fraud", "confirmed_fraud", "false_positive"):
        record = stored(db_session)
        review_prediction(db_session, record.id, status, None)

    stats = review_stats(db_session)
    assert stats.pending == len(queue) == 2
    assert stats.reviewed == 4  # the untouched low-risk record is not reviewed
    assert (stats.confirmed_fraud, stats.false_positive, stats.missed_by_model) == (3, 1, 0)
    assert stats.observed_precision == 0.75


def test_a_fraud_the_model_missed_is_not_counted_towards_precision(db_session):
    flagged = stored(db_session)
    review_prediction(db_session, flagged.id, "false_positive", None)
    missed = stored(db_session, risk_level="low", review_status="legitimate")
    review_prediction(db_session, missed.id, "confirmed_fraud", "found by the customer")

    stats = review_stats(db_session)
    assert (stats.confirmed_fraud, stats.false_positive, stats.missed_by_model) == (1, 1, 1)
    assert stats.observed_precision == 0.0  # 0 of the 1 flagged record was fraud

