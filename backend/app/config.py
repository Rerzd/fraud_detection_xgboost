"""Application settings. Every value can be overridden with an environment variable."""

import os
from dataclasses import dataclass, field
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent


def _env_list(name: str, default: str) -> list[str]:
    return [item.strip() for item in os.getenv(name, default).split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    model_path: Path = field(
        default_factory=lambda: Path(os.getenv("MODEL_PATH", BACKEND_DIR / "fraud_model.pkl"))
    )
    fraud_threshold: float = field(default_factory=lambda: float(os.getenv("FRAUD_THRESHOLD", "0.5")))
    review_threshold: float = field(default_factory=lambda: float(os.getenv("REVIEW_THRESHOLD", "0.2")))
    db_path: Path = field(
        default_factory=lambda: Path(os.getenv("DB_PATH", BACKEND_DIR / "data" / "fraud.db"))
    )
    batch_max_rows: int = field(default_factory=lambda: int(os.getenv("BATCH_MAX_ROWS", "10000")))
    batch_max_bytes: int = field(
        default_factory=lambda: int(os.getenv("BATCH_MAX_BYTES", str(5 * 1024 * 1024)))
    )
    model_version: str = field(default_factory=lambda: os.getenv("MODEL_VERSION", "xgb-paysim-v1"))
    cors_origins: list[str] = field(
        default_factory=lambda: _env_list(
            "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
        )
    )


def get_settings() -> Settings:
    """Read settings from the environment at call time (so tests can override them)."""
    return Settings()
