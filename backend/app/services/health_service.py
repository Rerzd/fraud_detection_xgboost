"""Readiness: is everything the API needs to answer requests working right now?"""

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.ml.model import FraudModel


def readiness_failures(model: FraudModel | None, session: Session) -> list[dict[str, str]]:
    """One `{field, message}` per failing check; an empty list means ready."""
    failures = []
    if model is None:
        failures.append({"field": "model", "message": "The model artifact is not loaded."})
    try:
        session.execute(text("SELECT 1"))
    except SQLAlchemyError:
        failures.append({"field": "database", "message": "The database does not answer queries."})
    return failures
