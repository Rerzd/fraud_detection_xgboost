"""Engine, session factory and schema versioning."""

import logging
from pathlib import Path

from sqlalchemy import create_engine, event, inspect
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker

from app.core.logging import kv
from app.db.models import SCHEMA_VERSION, Base

logger = logging.getLogger(__name__)


def ensure_schema(engine: Engine) -> None:
    """Make the database match `SCHEMA_VERSION`, rebuilding it when it does not.

    SQLite keeps an integer in `PRAGMA user_version` (0 in a file nobody has versioned). If it differs
    from `SCHEMA_VERSION` and the file already has tables, they are dropped and created again with a
    warning, and the version is stored. That is deliberate: there are no migrations, the log is demo
    data, and the alternative is a crash or silently wrong rows when a column is missing. A database
    written by a newer version is treated the same way, since this code only knows its own schema.
    """
    with engine.begin() as conn:
        found = conn.exec_driver_sql("PRAGMA user_version").scalar_one()
    if found == SCHEMA_VERSION:
        Base.metadata.create_all(engine)
        return

    if inspect(engine).get_table_names():
        logger.warning(
            kv(event="schema_rebuilt", found=found, expected=SCHEMA_VERSION, action="tables dropped")
        )
        Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with engine.begin() as conn:
        conn.exec_driver_sql(f"PRAGMA user_version = {int(SCHEMA_VERSION)}")


def create_sqlite_engine(url: str, **kwargs) -> Engine:
    """An engine that enforces foreign keys, which SQLite ignores unless asked per connection."""
    engine = create_engine(url, **kwargs)

    @event.listens_for(engine, "connect")
    def _enforce_foreign_keys(dbapi_connection, _record):
        dbapi_connection.execute("PRAGMA foreign_keys = ON")

    return engine


def init_db(db_path: Path) -> tuple[Engine, sessionmaker]:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    engine = create_sqlite_engine(f"sqlite:///{db_path}")
    ensure_schema(engine)
    return engine, sessionmaker(engine, expire_on_commit=False)
