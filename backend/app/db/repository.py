"""Queries over the predictions table."""

from collections.abc import Sequence

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.db.models import Prediction


def _to_record(tx: dict, probability: float, risk_level: str, source: str, batch_id: str | None):
    return Prediction(
        source=source,
        batch_id=batch_id,
        type=tx["type"],
        amount=tx["amount"],
        probability=probability,
        risk_level=risk_level,
        payload=tx,
    )


def insert(session: Session, tx: dict, probability: float, risk_level: str) -> Prediction:
    record = _to_record(tx, probability, risk_level, "single", None)
    session.add(record)
    session.commit()
    return record


def bulk_insert(session: Session, rows: list[tuple[dict, float, str]], batch_id: str) -> None:
    session.add_all(_to_record(tx, p, level, "batch", batch_id) for tx, p, level in rows)
    session.commit()


def list_recent(session: Session, limit: int, risk_level: str | None = None) -> Sequence[Prediction]:
    query = select(Prediction).order_by(Prediction.created_at.desc(), Prediction.id.desc()).limit(limit)
    if risk_level:
        query = query.where(Prediction.risk_level == risk_level)
    return session.scalars(query).all()


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


def clear(session: Session) -> int:
    deleted = session.execute(delete(Prediction)).rowcount
    session.commit()
    return deleted
