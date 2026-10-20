"""Documentation shown at /docs and /redoc: description, tags and the documented error responses."""

from typing import Any

from fastapi.routing import APIRoute

from app.schemas.common import ErrorResponse

TITLE = "Fraud Detection API"
VERSION = "1.0.0"
API_PREFIX = "/api/v1"  # every endpoint lives under it; a breaking change would add /api/v2

DESCRIPTION = """
Scores mobile-money transactions with an XGBoost classifier trained on **PaySim**, a synthetic
dataset. Send a raw transaction; the API reproduces the training notebook's preprocessing, returns
the fraud probability with a per-feature explanation, and keeps the result in a local SQLite log.

**Risk levels.** The probability is turned into a decision with two thresholds (configurable):
`low` (< 0.2, approve), `review` (0.2 to 0.5, send to manual review) and `high` (>= 0.5, flag for
fraud).

**Versioning.** Every endpoint is under `/api/v1`; a breaking change would be published as `/api/v2`.
`/api/v1/health` says the process is up, `/api/v1/ready` says it can serve (model loaded, database
answering).

**Traceability.** Each prediction carries `model_version` (the configured label) and `model_hash`
(the first 12 characters of the sha256 of the model file) and is stored with both, so a score can
always be tied to the exact artifact that produced it.

**Review.** Predictions the model flags (`high`, `review`) start as `pending`; low ones are taken as
`legitimate`. An analyst records a verdict with `PATCH /predictions/{id}/review`, and
`/predictions/stats` reports the precision observed on those verdicts. That number describes this
demo data only; it is not a model metric.

**Errors.** Every error, whatever its status, has the same body:
`{"error": {"code", "message", "details", "request_id"}}`. The `request_id` is also returned in the
`X-Request-ID` header (send your own to trace a call), next to `X-Process-Time-Ms`.

**Limits.** The model was trained on synthetic data and only knows `TRANSFER` and `CASH_OUT`
transactions. Probabilities are not calibrated. See `/api/v1/model/info` for the model card.
""".strip()

LICENSE = {"name": "MIT", "identifier": "MIT"}

TAGS = [
    {"name": "health", "description": "Liveness and model status."},
    {
        "name": "scoring",
        "description": "Score one transaction: probability, risk level, explanation and signals.",
    },
    {
        "name": "batches",
        "description": "Score a CSV of transactions in one call, and list the runs so far. Valid rows "
        "are stored; invalid rows are reported with their line number.",
    },
    {
        "name": "predictions",
        "description": "The prediction log: every stored score, paginated, with filters, statistics and "
        "the analyst review of each one.",
    },
    {
        "name": "model",
        "description": "The model card: training setup, metrics, thresholds and limits.",
    },
]

SWAGGER_UI_PARAMETERS = {
    "displayRequestDuration": True,
    "docExpansion": "list",
    "defaultModelsExpandDepth": -1,
    "tryItOutEnabled": True,
}

_EXAMPLE_REQUEST_ID = "5f0c8d52-3a1e-4b7c-9d41-8e6a2b7f1c03"


def unique_id(route: APIRoute) -> str:
    """Operation ids are the function names (`predict`, `predict_batch`), not the generated ones."""
    return route.name


def _doc(
    description: str, **examples: tuple[str, str, list[dict[str, str]] | None]
) -> dict[str, Any]:
    """An error response in the shared envelope, with one named example per (code, message, details)."""
    return {
        "model": ErrorResponse,
        "description": description,
        "content": {
            "application/json": {
                "examples": {
                    name: {
                        "value": {
                            "error": {
                                "code": code,
                                "message": message,
                                "details": details,
                                "request_id": _EXAMPLE_REQUEST_ID,
                            }
                        }
                    }
                    for name, (code, message, details) in examples.items()
                }
            }
        },
    }


VALIDATION_ERROR = {
    422: _doc(
        "A field is missing or has an invalid value. `details` lists each problem.",
        amount=(
            "VALIDATION_ERROR",
            "amount: Input should be greater than 0",
            [{"field": "amount", "message": "Input should be greater than 0"}],
        ),
    )
}

NOT_FOUND = {
    404: _doc(
        "The resource does not exist.",
        prediction=("NOT_FOUND", "Prediction 42 not found.", None),
        batch=("NOT_FOUND", "Batch 3f9c0d1e5a7b4c2e8d6f1a0b9c8d7e6f not found.", None),
    )
}

MODEL_UNAVAILABLE = {
    503: _doc(
        "The model artifact could not be loaded, so nothing can be scored.",
        model=("MODEL_UNAVAILABLE", "The model is not loaded, so nothing can be scored.", None),
    )
}

NOT_READY = {
    503: _doc(
        "The model or the database is not working; `details` names each failing check.",
        model=(
            "NOT_READY",
            "The service is not ready.",
            [{"field": "model", "message": "The model artifact is not loaded."}],
        ),
    )
}

BATCH_ERRORS = {
    413: _doc(
        "The file has more bytes or more rows than the configured limits "
        "(see `/predict/batch/limits`).",
        rows=("BATCH_TOO_LARGE", "Too many rows: the limit is 10,000.", None),
        bytes=("BATCH_TOO_LARGE", "File too large: the limit is 5 MB.", None),
    ),
    422: _doc(
        "The file cannot be read as the expected CSV, or the upload has no file.",
        columns=("INVALID_CSV", "Missing required columns: oldbalanceDest, newbalanceDest.", None),
        upload=(
            "VALIDATION_ERROR",
            "file: Field required",
            [{"field": "file", "message": "Field required"}],
        ),
    ),
}
