"""Application settings.

Every value can be set with an environment variable named `FRAUD_<FIELD>` (for example
`FRAUD_DB_PATH`), or in `backend/.env`. See `backend/.env.example` for the full list. The one
exception is the high-risk cut-off, whose variable is `FRAUD_THRESHOLD` rather than the
awkward `FRAUD_FRAUD_THRESHOLD`.
"""

from functools import lru_cache
from pathlib import Path
from typing import Annotated, Literal

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]

DEFAULT_CORS_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="FRAUD_",
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        validate_by_name=True,  # tests build Settings(fraud_threshold=...) by field name
        protected_namespaces=("settings_",),  # `model_path` and `model_version` are ours
    )

    model_path: Path = BACKEND_DIR / "fraud_model.pkl"
    model_version: str = "xgb-paysim-v1"
    db_path: Path = BACKEND_DIR / "data" / "fraud.db"

    review_threshold: float = Field(0.2, gt=0, lt=1)
    fraud_threshold: float = Field(0.5, gt=0, lt=1, validation_alias="FRAUD_THRESHOLD")

    batch_max_rows: int = Field(10_000, ge=1)
    batch_max_bytes: int = Field(5 * 1024 * 1024, ge=1)

    # Comma-separated in the environment; NoDecode stops pydantic-settings expecting JSON.
    cors_origins: Annotated[list[str], NoDecode] = DEFAULT_CORS_ORIGINS

    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @field_validator("log_level", mode="before")
    @classmethod
    def _upper_level(cls, value: object) -> object:
        return value.upper() if isinstance(value, str) else value

    @model_validator(mode="after")
    def _thresholds_are_ordered(self) -> "Settings":
        if self.review_threshold >= self.fraud_threshold:
            raise ValueError("FRAUD_REVIEW_THRESHOLD must be lower than FRAUD_THRESHOLD")
        return self


@lru_cache
def get_settings() -> Settings:
    """Settings for the running server, read once. Tests build `Settings(...)` directly."""
    return Settings()
