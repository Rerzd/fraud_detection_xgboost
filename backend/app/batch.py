"""CSV parsing and validation for batch scoring."""

import csv
import io

from pydantic import ValidationError

from app.schemas import TransactionIn

REQUIRED_COLUMNS = list(TransactionIn.model_fields)


class BatchError(ValueError):
    """The file as a whole cannot be processed."""


def parse_csv(content: bytes, max_rows: int) -> tuple[list[tuple[int, dict]], list[dict]]:
    """Return (valid rows, row errors). Row numbers are CSV line numbers (header is line 1)."""
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise BatchError("File is not valid UTF-8 text.") from exc

    reader = csv.DictReader(io.StringIO(text))
    columns = [c.strip() for c in reader.fieldnames or []]
    missing = [c for c in REQUIRED_COLUMNS if c not in columns]
    if missing:
        raise BatchError(f"Missing required columns: {', '.join(missing)}.")
    reader.fieldnames = columns

    valid: list[tuple[int, dict]] = []
    errors: list[dict] = []
    for index, raw in enumerate(reader):
        if index >= max_rows:
            raise BatchError(f"Too many rows: the limit is {max_rows:,}.")
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
        raise BatchError("The file has no data rows.")
    return valid, errors
