"""Engine and session factory."""

from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker

from app.db.models import Base


def init_db(db_path: Path) -> tuple[Engine, sessionmaker]:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    engine = create_engine(f"sqlite:///{db_path}")
    Base.metadata.create_all(engine)
    return engine, sessionmaker(engine, expire_on_commit=False)
