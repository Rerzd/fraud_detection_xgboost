"""ORM models.

Intentionally light for a local demo: `create_all` on startup, no migrations. Instead, the schema
carries a version (`SCHEMA_VERSION`, stored in SQLite's `PRAGMA user_version`). Change a table and
bump the number in the same commit: a database file written by another version is dropped and
rebuilt on startup (see `app.db.session`), so the stored history is disposable demo data.
"""

from datetime import UTC, datetime

from sqlalchemy import JSON, DateTime, Float, Integer, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

SCHEMA_VERSION = 1


class Base(DeclarativeBase):
    pass


class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), index=True
    )
    source: Mapped[str] = mapped_column(String(10))  # "single" | "batch"
    batch_id: Mapped[str | None] = mapped_column(String(32), index=True)
    type: Mapped[str] = mapped_column(String(10))
    amount: Mapped[float] = mapped_column(Float)
    probability: Mapped[float] = mapped_column(Float)
    risk_level: Mapped[str] = mapped_column(String(10), index=True)
    payload: Mapped[dict] = mapped_column(JSON)
    # Which model artifact produced the score: the configured label and the pickle's short sha256.
    model_version: Mapped[str] = mapped_column(String(64))
    model_hash: Mapped[str] = mapped_column(String(12))
    # The X-Request-ID of the call that created the row, to find its log lines.
    request_id: Mapped[str | None] = mapped_column(String(128))
