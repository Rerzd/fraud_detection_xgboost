"""The analyst review workflow: which statuses records start in, what a review may say, and the
statistics that come out of the reviews."""

from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.core.errors import NotFoundError, RuleViolationError
from app.db import repository
from app.db.models import Prediction
from app.schemas.review import ReviewStats, ReviewStatus


def initial_status(risk_level: str) -> ReviewStatus:
    """Records the model flagged wait for an analyst; low-risk ones are taken as legitimate."""
    return "legitimate" if risk_level == "low" else "pending"


def _violation(field: str, message: str) -> RuleViolationError:
    return RuleViolationError(f"{field}: {message}", [{"field": field, "message": message}])


def check_review(risk_level: str, status: ReviewStatus, note: str | None) -> None:
    """Raise `RuleViolationError` if this verdict is not allowed for a prediction at this risk."""
    if status == "pending":
        raise _violation(
            "status",
            "pending is the initial state and cannot be set; "
            "choose confirmed_fraud, false_positive or legitimate.",
        )
    if risk_level == "low" and status == "false_positive":
        raise _violation(
            "status", "A low-risk prediction was not flagged, so it cannot be a false positive."
        )
    if risk_level == "low" and status == "confirmed_fraud" and not note:
        raise _violation("note", "A note is required to confirm fraud on a low-risk prediction.")


def review_prediction(
    session: Session, prediction_id: int, status: ReviewStatus, note: str | None
) -> Prediction:
    """Record an analyst's verdict. A later review replaces the earlier one entirely."""
    record = repository.get_prediction(session, prediction_id)
    if record is None:
        raise NotFoundError(f"Prediction {prediction_id} not found.")
    note = (note or "").strip() or None
    check_review(record.risk_level, status, note)
    return repository.save_review(
        session, record, status=status, note=note, reviewed_at=datetime.now(UTC)
    )


def observed_precision(confirmed: int, false_positives: int) -> float | None:
    """confirmed / (confirmed + false positives), or None when nothing has been judged yet."""
    judged = confirmed + false_positives
    return confirmed / judged if judged else None


def review_stats(session: Session) -> ReviewStats:
    """Review counts and the precision observed on them.

    Precision is about what the model flagged, so a fraud an analyst found among predictions the
    model had scored as low risk (`missed_by_model`) is left out of it.
    """
    counts = repository.review_counts(session)
    flagged_confirmed = counts["confirmed_fraud"] - counts["missed_by_model"]
    return ReviewStats(
        **counts,
        observed_precision=observed_precision(flagged_confirmed, counts["false_positive"]),
    )
