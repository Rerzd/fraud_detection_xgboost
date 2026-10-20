import re
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.core.config import BACKEND_DIR, Settings, get_settings


def make(**overrides) -> Settings:
    """Settings that ignore a developer's local backend/.env."""
    return Settings(_env_file=None, **overrides)


def test_defaults_are_the_documented_ones():
    s = make()
    assert s.model_path == BACKEND_DIR / "fraud_model.pkl"
    assert s.db_path == BACKEND_DIR / "data" / "fraud.db"
    assert s.model_version == "xgb-paysim-v1"
    assert (s.review_threshold, s.fraud_threshold) == (0.2, 0.5)
    assert (s.batch_max_rows, s.batch_max_bytes) == (10_000, 5 * 1024 * 1024)
    assert s.cors_origins == [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]
    assert s.log_level == "INFO"


def test_environment_overrides_use_the_fraud_prefix(monkeypatch, tmp_path):
    monkeypatch.setenv("FRAUD_DB_PATH", str(tmp_path / "x.db"))
    monkeypatch.setenv("FRAUD_MODEL_VERSION", "xgb-test")
    monkeypatch.setenv("FRAUD_REVIEW_THRESHOLD", "0.3")
    monkeypatch.setenv("FRAUD_THRESHOLD", "0.7")
    monkeypatch.setenv("FRAUD_BATCH_MAX_ROWS", "25")
    monkeypatch.setenv("FRAUD_BATCH_MAX_BYTES", "1024")
    monkeypatch.setenv("FRAUD_LOG_LEVEL", "debug")
    s = make()
    assert s.db_path == Path(tmp_path / "x.db")
    assert s.model_version == "xgb-test"
    assert (s.review_threshold, s.fraud_threshold) == (0.3, 0.7)
    assert (s.batch_max_rows, s.batch_max_bytes) == (25, 1024)
    assert s.log_level == "DEBUG"


def test_cors_origins_are_comma_separated(monkeypatch):
    monkeypatch.setenv("FRAUD_CORS_ORIGINS", "https://a.example, https://b.example ,")
    assert make().cors_origins == ["https://a.example", "https://b.example"]


def test_variables_without_the_prefix_are_ignored(monkeypatch):
    monkeypatch.setenv("BATCH_MAX_ROWS", "1")
    monkeypatch.setenv("DB_PATH", "/nowhere.db")
    assert make().batch_max_rows == 10_000


def test_env_file_is_read_and_environment_wins(monkeypatch, tmp_path):
    env_file = tmp_path / ".env"
    env_file.write_text("FRAUD_MODEL_VERSION=from-file\nFRAUD_BATCH_MAX_ROWS=7\n")
    monkeypatch.setenv("FRAUD_BATCH_MAX_ROWS", "9")
    s = Settings(_env_file=env_file)
    assert s.model_version == "from-file"
    assert s.batch_max_rows == 9


@pytest.mark.parametrize(
    "overrides",
    [
        {"review_threshold": 0.6},  # not below the fraud threshold
        {"fraud_threshold": 1.5},
        {"review_threshold": 0},
        {"batch_max_rows": 0},
        {"log_level": "CHATTY"},
    ],
)
def test_invalid_values_fail_at_startup(overrides):
    with pytest.raises(ValidationError):
        make(**overrides)


def test_get_settings_is_cached(monkeypatch):
    get_settings.cache_clear()
    try:
        monkeypatch.setenv("FRAUD_MODEL_VERSION", "first")
        assert get_settings().model_version == "first"
        monkeypatch.setenv("FRAUD_MODEL_VERSION", "second")
        assert get_settings() is get_settings()
        assert get_settings().model_version == "first"
    finally:
        get_settings.cache_clear()


def test_env_example_documents_every_variable_with_its_default():
    text = (BACKEND_DIR / ".env.example").read_text()
    for name, field in Settings.model_fields.items():
        variable = field.validation_alias or f"FRAUD_{name.upper()}"
        assert re.search(rf"^#? ?{variable}=", text, re.M), (
            f"{variable} is missing from .env.example"
        )
    example = Settings(_env_file=BACKEND_DIR / ".env.example")
    assert example.model_dump() == make().model_dump()
