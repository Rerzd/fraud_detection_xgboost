"""SQLite persistence for prediction history.

Intentionally light for a local demo: one table, `create_all` on startup, no migrations.
"""

from datetime import UTC, datetime
from pathlib import Path

from sqlalchemy import JSON, DateTime, Float, Integer, String, create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker


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


def init_db(db_path: Path) -> tuple[Engine, sessionmaker]:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    engine = create_engine(f"sqlite:///{db_path}")
    Base.metadata.create_all(engine)
    return engine, sessionmaker(engine, expire_on_commit=False)
