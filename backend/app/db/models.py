"""ORM models.

Intentionally light for a local demo: `create_all` on startup, no migrations. Instead, the schema
carries a version (`SCHEMA_VERSION`, stored in SQLite's `PRAGMA user_version`). Change a table and
bump the number in the same commit: a database file written by another version is dropped and
rebuilt on startup (see `app.db.session`), so the stored history is disposable demo data.
"""

from datetime import UTC, datetime

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

SCHEMA_VERSION = 3


class Base(DeclarativeBase):
    pass


class Batch(Base):
    """One uploaded CSV: what was scored and with which model. Its rows are `Prediction`s."""

    __tablename__ = "batches"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)  # uuid4 hex
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), index=True
    )
    filename: Mapped[str | None] = mapped_column(String(255))
    total_rows: Mapped[int] = mapped_column(Integer)  # data rows in the file, valid or not
    scored: Mapped[int] = mapped_column(Integer)
    invalid: Mapped[int] = mapped_column(Integer)
    flagged: Mapped[int] = mapped_column(Integer)  # scored rows at high risk
    model_version: Mapped[str] = mapped_column(String(64))
    model_hash: Mapped[str] = mapped_column(String(12))


class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), index=True
    )
    source: Mapped[str] = mapped_column(String(10))  # "single" | "batch"
    batch_id: Mapped[str | None] = mapped_column(ForeignKey("batches.id"), index=True)
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
    # Analyst workflow: "pending" for high and review predictions, "legitimate" for low ones,
    # until an analyst decides. `reviewed_at` is set only by an analyst, so it tells which
    # predictions have been looked at.
    review_status: Mapped[str] = mapped_column(String(20), index=True)
    review_note: Mapped[str | None] = mapped_column(String(500))
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
