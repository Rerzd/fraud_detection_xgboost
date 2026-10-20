"""Logging: standard library only, one line per event, `key=value` fields, UTC timestamps.

2026-10-19T04:12:11Z INFO app.request method=POST path=/predict status=200 duration_ms=12.41 request_id=...
"""

import json
import logging
import time

LOGGER_NAME = "app"
_HANDLER_MARK = "_fraud_api_handler"


class _UtcFormatter(logging.Formatter):
    converter = time.gmtime


def kv(**fields: object) -> str:
    """Render fields as `key=value`, quoting values that contain spaces or quotes."""
    parts = []
    for key, value in fields.items():
        text = str(value)
        if not text or any(ch in text for ch in ' "='):
            text = json.dumps(text)
        parts.append(f"{key}={text}")
    return " ".join(parts)


def configure_logging(level: str) -> None:
    """Attach one stderr handler to the `app` logger. Safe to call again: it only updates the level."""
    logger = logging.getLogger(LOGGER_NAME)
    logger.setLevel(level)
    if any(getattr(h, _HANDLER_MARK, False) for h in logger.handlers):
        return
    handler = logging.StreamHandler()
    handler.setFormatter(
        _UtcFormatter("%(asctime)s %(levelname)s %(name)s %(message)s", "%Y-%m-%dT%H:%M:%SZ")
    )
    setattr(handler, _HANDLER_MARK, True)
    logger.addHandler(handler)
