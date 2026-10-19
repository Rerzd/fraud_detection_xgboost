import pytest

from app.ml.model import risk_level


@pytest.mark.parametrize(
    ("probability", "expected"),
    [
        (0.0, "low"),
        (0.1999, "low"),
        (0.2, "review"),  # the review threshold belongs to the review band
        (0.4999, "review"),
        (0.5, "high"),  # the fraud threshold belongs to the high band
        (1.0, "high"),
    ],
)
def test_bands_and_boundaries(probability, expected):
    assert risk_level(probability, review_threshold=0.2, fraud_threshold=0.5) == expected


def test_thresholds_are_parameters_not_constants():
    assert risk_level(0.3, review_threshold=0.1, fraud_threshold=0.3) == "high"
