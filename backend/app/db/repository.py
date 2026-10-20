"""Queries over the predictions and batches tables."""

from collections.abc import Sequence
from datetime import UTC, datetime

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.db.models import Batch, Prediction


def _to_record(
    tx: dict,
    probability: float,
    risk_level: str,
    review_status: str,
    source: str,
    batch_id: str | None,
    model_version: str,
    model_hash: str,
    request_id: str | None,
):
    return Prediction(
        source=source,
        batch_id=batch_id,
        type=tx["type"],
        amount=tx["amount"],
        probability=probability,
        risk_level=risk_level,
        payload=tx,
        model_version=model_version,
        model_hash=model_hash,
        request_id=request_id,
        review_status=review_status,
    )


def insert(
    session: Session,
    tx: dict,
    probability: float,
    risk_level: str,
    *,
    review_status: str,
    model_version: str,
    model_hash: str,
    request_id: str | None = None,
) -> Prediction:
    record = _to_record(
        tx,
        probability,
        risk_level,
        review_status,
        "single",
        None,
        model_version,
        model_hash,
        request_id,
    )
    session.add(record)
    session.commit()
    return record


def insert_batch(
    session: Session,
    *,
    batch_id: str,
    filename: str | None,
    total_rows: int,
    scored: int,
    invalid: int,
    flagged: int,
    rows: list[tuple[dict, float, str, str]],
    model_version: str,
    model_hash: str,
    request_id: str | None = None,
) -> Batch:
    """Store a batch and its scored rows, given as (transaction, probability, risk, review status),
    in one transaction."""
    batch = Batch(
        id=batch_id,
        filename=filename,
        total_rows=total_rows,
        scored=scored,
        invalid=invalid,
        flagged=flagged,
        model_version=model_version,
        model_hash=model_hash,
    )
    session.add(batch)
    session.flush()  # the batch row must exist before predictions point at it
    session.add_all(
        _to_record(tx, p, level, status, "batch", batch_id, model_version, model_hash, request_id)
        for tx, p, level, status in rows
    )
    session.commit()
    return batch


def _utc(moment: datetime) -> datetime:
    """SQLite stores naive UTC, so compare against naive UTC; a naive input is taken as UTC."""
    if moment.tzinfo is not None:
        moment = moment.astimezone(UTC)
    return moment.replace(tzinfo=None)


def list_predictions(
    session: Session,
    *,
    limit: int,
    offset: int = 0,
    risk_level: str | None = None,
    source: str | None = None,
    batch_id: str | None = None,
    review_status: str | None = None,
    created_from: datetime | None = None,
    created_to: datetime | None = None,
    sort: str = "newest",
) -> tuple[Sequence[Prediction], int]:
    """One page of predictions and how many match the filters in total.

    `sort` is "newest" (creation time) or "probability" (highest first); the id breaks ties.
    """
    filters = []
    if risk_level:
        filters.append(Prediction.risk_level == risk_level)
    if source:
        filters.append(Prediction.source == source)
    if batch_id:
        filters.append(Prediction.batch_id == batch_id)
    if review_status:
        filters.append(Prediction.review_status == review_status)
    if created_from:
        filters.append(Prediction.created_at >= _utc(created_from))
    if created_to:
        filters.append(Prediction.created_at <= _utc(created_to))

    order = (
        (Prediction.probability.desc(), Prediction.id.desc())
        if sort == "probability"
        else (Prediction.created_at.desc(), Prediction.id.desc())
    )
    total = session.scalar(select(func.count()).select_from(Prediction).where(*filters))
    page = session.scalars(
        select(Prediction).where(*filters).order_by(*order).limit(limit).offset(offset)
    ).all()
    return page, total


def get_prediction(session: Session, prediction_id: int) -> Prediction | None:
    return session.get(Prediction, prediction_id)


def save_review(
    session: Session, record: Prediction, *, status: str, note: str | None, reviewed_at: datetime
) -> Prediction:
    record.review_status = status
    record.review_note = note
    record.reviewed_at = reviewed_at
    session.commit()
    return record


def list_batches(session: Session, *, limit: int, offset: int = 0) -> tuple[Sequence[Batch], int]:
    """One page of batches, newest first, and the total number of batches."""
    total = session.scalar(select(func.count()).select_from(Batch))
    page = session.scalars(
        select(Batch).order_by(Batch.created_at.desc(), Batch.id.desc()).limit(limit).offset(offset)
    ).all()
    return page, total


def get_batch(session: Session, batch_id: str) -> Batch | None:
    return session.get(Batch, batch_id)


def stats(session: Session) -> dict:
    by_risk = {"low": 0, "review": 0, "high": 0}
    by_source = {"single": 0, "batch": 0}
    for level, count in session.execute(
        select(Prediction.risk_level, func.count()).group_by(Prediction.risk_level)
    ):
        by_risk[level] = count
    for source, count in session.execute(
        select(Prediction.source, func.count()).group_by(Prediction.source)
    ):
        by_source[source] = count
    return {"total": sum(by_risk.values()), "by_risk": by_risk, "by_source": by_source}


def review_counts(session: Session) -> dict[str, int]:
    """Raw counts behind the review statistics (see `review_service.review_stats`)."""

    def count(*where) -> int:
        return session.scalar(select(func.count()).select_from(Prediction).where(*where))

    return {
        "pending": count(Prediction.review_status == "pending"),
        "reviewed": count(Prediction.reviewed_at.is_not(None)),
        "confirmed_fraud": count(Prediction.review_status == "confirmed_fraud"),
        "false_positive": count(Prediction.review_status == "false_positive"),
        "missed_by_model": count(
            Prediction.review_status == "confirmed_fraud", Prediction.risk_level == "low"
        ),
    }


def clear(session: Session) -> tuple[int, int]:
    """Delete every prediction and every batch; returns (predictions, batches) deleted."""
    predictions = session.execute(delete(Prediction)).rowcount
    batches = session.execute(delete(Batch)).rowcount
    session.commit()
    return predictions, batches
