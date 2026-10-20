"""The analyst review workflow: statuses, the review request and the observed statistics."""

from typing import Literal

from pydantic import BaseModel, Field

ReviewStatus = Literal["pending", "confirmed_fraud", "false_positive", "legitimate"]

NOTE_MAX_LENGTH = 500


class ReviewIn(BaseModel):
    status: ReviewStatus = Field(
        description="The analyst's verdict. `pending` is the initial state and cannot be set."
    )
    note: str | None = Field(
        default=None,
        max_length=NOTE_MAX_LENGTH,
        description="Why, in the analyst's words. "
        "Required to confirm fraud on a low-risk prediction.",
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "status": "confirmed_fraud",
                    "note": "Account drained to a new payee; customer called.",
                }
            ]
        }
    }


class ReviewStats(BaseModel):
    """Counts from analyst reviews of the stored demo data. Not a model metric."""

    pending: int = Field(
        description="Review queue: high and review predictions nobody has looked at"
    )
    reviewed: int = Field(description="Predictions an analyst has reviewed")
    confirmed_fraud: int
    false_positive: int
    missed_by_model: int = Field(
        description="Confirmed frauds the model had scored as low risk "
        "(included in `confirmed_fraud`)"
    )
    observed_precision: float | None = Field(
        description="Of the predictions the model flagged (high or review) and an analyst judged, "
        "the share confirmed as fraud: confirmed / (confirmed + false positives). Null until there "
        "is one such judgement. Measured on this demo data, so it says nothing about real-world "
        "performance and is not the notebook's test-set precision."
    )
