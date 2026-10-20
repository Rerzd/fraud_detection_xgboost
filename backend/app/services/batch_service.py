"""Batch scoring: CSV parsing, limits, per-row errors, scoring and persistence."""

import csv
import io
import uuid
from pathlib import PurePath

from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.errors import BatchTooLargeError, InvalidCsvError
from app.db import repository
from app.ml.model import FraudModel, risk_level
from app.ml.preprocessing import build_features
from app.schemas.batches import BatchOut
from app.schemas.scoring import TransactionIn
from app.services import review_service

REQUIRED_COLUMNS = list(TransactionIn.model_fields)


def parse_csv(content: bytes, max_rows: int) -> tuple[list[tuple[int, dict]], list[dict]]:
    """Return (valid rows, row errors). Row numbers are CSV line numbers (header is line 1)."""
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise InvalidCsvError("File is not valid UTF-8 text.") from exc

    reader = csv.DictReader(io.StringIO(text))
    columns = [c.strip() for c in reader.fieldnames or []]
    missing = [c for c in REQUIRED_COLUMNS if c not in columns]
    if missing:
        raise InvalidCsvError(f"Missing required columns: {', '.join(missing)}.")
    reader.fieldnames = columns

    valid: list[tuple[int, dict]] = []
    errors: list[dict] = []
    for index, raw in enumerate(reader):
        if index >= max_rows:
            raise BatchTooLargeError(f"Too many rows: the limit is {max_rows:,}.")
        line = index + 2
        values = {c: (raw.get(c) or "").strip() for c in REQUIRED_COLUMNS}
        if not any(values.values()):
            continue  # skip blank lines
        try:
            tx = TransactionIn.model_validate(values)
        except ValidationError as exc:
            reason = "; ".join(f"{e['loc'][0]}: {e['msg']}" for e in exc.errors())
            errors.append({"row": line, "reason": reason})
            continue
        valid.append((line, tx.model_dump()))

    if not valid and not errors:
        raise InvalidCsvError("The file has no data rows.")
    return valid, errors


def _clean_filename(name: str | None) -> str | None:
    """Only the file's own name, at most 255 characters; None when the client sent none."""
    cleaned = PurePath((name or "").replace("\\", "/")).name[:255]
    return cleaned or None


def score_batch(
    content: bytes,
    model: FraudModel,
    settings: Settings,
    session: Session,
    request_id: str | None = None,
    filename: str | None = None,
) -> BatchOut:
    """Score every valid row of an uploaded CSV, store the batch and its rows, summarise the run.

    `content` may be read up to `batch_max_bytes + 1` bytes, so an oversized upload is detected
    without reading all of it.
    """
    if len(content) > settings.batch_max_bytes:
        limit_mb = settings.batch_max_bytes / (1024 * 1024)
        raise BatchTooLargeError(f"File too large: the limit is {limit_mb:g} MB.")
    valid, errors = parse_csv(content, settings.batch_max_rows)

    rows: list[dict] = []
    if valid:
        probabilities = model.predict_proba(build_features(tx for _, tx in valid))
        for (line, tx), p in zip(valid, probabilities, strict=True):
            level = risk_level(p, settings.review_threshold, settings.fraud_threshold)
            rows.append({"row": line, **tx, "probability": p, "risk_level": level})

    risk_counts = {"low": 0, "review": 0, "high": 0}
    for r in rows:
        risk_counts[r["risk_level"]] += 1

    batch_id = uuid.uuid4().hex
    filename = _clean_filename(filename)
    repository.insert_batch(
        session,
        batch_id=batch_id,
        filename=filename,
        total_rows=len(rows) + len(errors),
        scored=len(rows),
        invalid=len(errors),
        flagged=risk_counts["high"],
        rows=[
            (
                {k: r[k] for k in TransactionIn.model_fields},
                r["probability"],
                r["risk_level"],
                review_service.initial_status(r["risk_level"]),
            )
            for r in rows
        ],
        model_version=model.version,
        model_hash=model.short_hash,
        request_id=request_id,
    )

    rows.sort(key=lambda r: r["probability"], reverse=True)
    return BatchOut(
        batch_id=batch_id,
        filename=filename,
        model_version=model.version,
        model_hash=model.short_hash,
        summary={
            "total": len(rows) + len(errors),
            "scored": len(rows),
            "invalid": len(errors),
            "risk_counts": risk_counts,
            "flagged_rate": risk_counts["high"] / len(rows) if rows else 0.0,
        },
        rows=rows,
        errors=errors,
    )
