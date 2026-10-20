from datetime import UTC, datetime, timedelta

import pytest

from conftest import (
    CSV_3_VALID_1_INVALID,
    NOTEBOOK_FRAUD_ROW,
    assert_envelope,
    csv_of,
    make_prediction,
    upload,
)

URL = "/api/v1/predictions"
T0 = datetime(2026, 1, 1, 12, 0, 0, tzinfo=UTC)


def seed(client, **overrides) -> int:
    """Store a prediction directly, with a chosen `created_at`, and return its id."""
    with client.app.state.sessionmaker() as session:
        record = make_prediction(**overrides)
        session.add(record)
        session.commit()
        return record.id


def ids(client, **params) -> list[int]:
    return [item["id"] for item in client.get(URL, params=params).json()["items"]]


def test_predict_persists_one_row(client):
    sent = client.post("/api/v1/predict", json=NOTEBOOK_FRAUD_ROW).json()
    page = client.get(URL).json()
    assert page["total"] == 1
    (item,) = page["items"]
    assert item["id"] == sent["id"]
    assert item["source"] == "single"
    assert item["risk_level"] == "high"
    assert item["payload"] == NOTEBOOK_FRAUD_ROW


def test_the_page_has_items_total_limit_and_offset(client):
    upload(client, csv_of(3))
    assert client.get(URL).json().keys() == {"items", "total", "limit", "offset"}
    page = client.get(URL).json()
    assert (page["total"], page["limit"], page["offset"]) == (3, 50, 0)


def test_pages_walk_the_whole_log_without_overlap(client):
    upload(client, csv_of(5))
    everything = ids(client, limit=200)
    pages = [ids(client, limit=2, offset=offset) for offset in (0, 2, 4)]
    assert [len(p) for p in pages] == [2, 2, 1]
    assert sum(pages, []) == everything
    totals = {client.get(URL, params={"limit": 2, "offset": o}).json()["total"] for o in (0, 2, 4)}
    assert totals == {5}


def test_an_offset_past_the_end_is_an_empty_page_not_an_error(client):
    upload(client, csv_of(2))
    page = client.get(URL, params={"offset": 50}).json()
    assert page["items"] == [] and page["total"] == 2 and page["offset"] == 50


def test_newest_first_with_the_id_as_tie_breaker(client):
    old = seed(client, created_at=T0 - timedelta(hours=1))
    a = seed(client)
    b = seed(client)  # same instant as `a`, higher id
    new = seed(client, created_at=T0 + timedelta(hours=1))
    assert ids(client) == [new, b, a, old]


@pytest.mark.parametrize(
    ("params", "valid"),
    [
        ({"limit": 1}, True),
        ({"limit": 200}, True),
        ({"limit": 201}, False),
        ({"limit": 0}, False),
        ({"offset": 0}, True),
        ({"offset": -1}, False),
    ],
)
def test_page_size_and_offset_are_bounded(client, params, valid):
    response = client.get(URL, params=params)
    if valid:
        assert response.status_code == 200
    else:
        assert_envelope(response, 422, "VALIDATION_ERROR")


def test_filter_by_risk_level_and_source(client):
    client.post("/api/v1/predict", json=NOTEBOOK_FRAUD_ROW)
    upload(client, CSV_3_VALID_1_INVALID)  # 1 high, 1 review, 1 low

    high = client.get(URL, params={"risk_level": "high"}).json()
    assert high["total"] == 2 and {i["risk_level"] for i in high["items"]} == {"high"}
    batch_only = client.get(URL, params={"source": "batch"}).json()
    assert batch_only["total"] == 3 and {i["source"] for i in batch_only["items"]} == {"batch"}
    both = client.get(URL, params={"source": "single", "risk_level": "high"}).json()
    assert both["total"] == 1
    assert client.get(URL, params={"source": "single", "risk_level": "low"}).json()["total"] == 0


def test_filter_by_batch_id(client):
    first = upload(client, csv_of(2)).json()["batch_id"]
    second = upload(client, csv_of(3)).json()["batch_id"]
    for batch_id, count in ((first, 2), (second, 3)):
        page = client.get(URL, params={"batch_id": batch_id}).json()
        assert page["total"] == count
        assert {i["batch_id"] for i in page["items"]} == {batch_id}
    assert client.get(URL, params={"batch_id": "nope"}).json()["total"] == 0


def test_filter_by_creation_time_is_inclusive(client):
    early = seed(client, created_at=T0 - timedelta(days=2))
    middle = seed(client, created_at=T0)
    late = seed(client, created_at=T0 + timedelta(days=2))

    assert ids(client, created_from=T0.isoformat()) == [late, middle]
    assert ids(client, created_to=T0.isoformat()) == [middle, early]
    window = {"created_from": (T0 - timedelta(days=1)).isoformat(), "created_to": (T0 + timedelta(days=1)).isoformat()}
    assert ids(client, **window) == [middle]


def test_creation_time_filters_honour_offsets_and_default_to_utc(client):
    seed(client, created_at=datetime(2026, 1, 1, 23, 0, 0, tzinfo=UTC))
    # 2026-01-02T01:00+02:00 is exactly 23:00 UTC the day before.
    assert len(ids(client, created_from="2026-01-02T01:00:00+02:00")) == 1
    assert len(ids(client, created_from="2026-01-02T01:00:01+02:00")) == 0
    # A naive instant is read as UTC.
    assert len(ids(client, created_from="2026-01-01T23:00:00")) == 1
    assert len(ids(client, created_to="2026-01-01T22:59:59")) == 0


def test_filters_combine_with_pagination(client):
    for _ in range(3):
        seed(client, risk_level="high")
    seed(client, risk_level="low")
    page = client.get(URL, params={"risk_level": "high", "limit": 2, "offset": 2}).json()
    assert page["total"] == 3 and len(page["items"]) == 1


@pytest.mark.parametrize(
    "params",
    [{"risk_level": "extreme"}, {"source": "other"}, {"created_from": "yesterday"}, {"created_to": "2026-13-45"}],
)
def test_invalid_filter_values_are_validation_errors(client, params):
    assert_envelope(client.get(URL, params=params), 422, "VALIDATION_ERROR")


def test_timestamps_are_utc_with_a_zone_marker(client):
    seed(client, created_at=T0)
    created_at = client.get(URL).json()["items"][0]["created_at"]
    assert created_at == "2026-01-01T12:00:00Z"


def test_get_one_prediction(client):
    sent = client.post("/api/v1/predict", json=NOTEBOOK_FRAUD_ROW).json()
    record = client.get(f"{URL}/{sent['id']}")
    assert record.status_code == 200
    assert record.json() == client.get(URL).json()["items"][0]
    assert record.json()["probability"] == sent["probability"]


def test_an_unknown_prediction_is_a_404_envelope(client):
    error = assert_envelope(client.get(f"{URL}/999"), 404, "NOT_FOUND")
    assert error["message"] == "Prediction 999 not found."


@pytest.mark.parametrize("bad", ["0", "-3", "abc", "1.5"])
def test_a_malformed_prediction_id_is_a_validation_error(client, bad):
    assert_envelope(client.get(f"{URL}/{bad}"), 422, "VALIDATION_ERROR")


def test_stats_is_not_mistaken_for_an_id(client):
    assert client.get(f"{URL}/stats").json()["total"] == 0


def test_stats_are_correct(client):
    client.post("/api/v1/predict", json=NOTEBOOK_FRAUD_ROW)
    upload(client, CSV_3_VALID_1_INVALID)
    stats = client.get(f"{URL}/stats").json()
    assert {k: stats[k] for k in ("total", "by_risk", "by_source")} == {
        "total": 4,
        "by_risk": {"low": 1, "review": 1, "high": 2},
        "by_source": {"single": 1, "batch": 3},
    }


def test_clear_removes_predictions_and_batches(client):
    upload(client, CSV_3_VALID_1_INVALID)
    client.post("/api/v1/predict", json=NOTEBOOK_FRAUD_ROW)
    assert client.delete(URL).json() == {"deleted": 4, "batches_deleted": 1}
    assert client.get(URL).json()["items"] == []
    assert client.get("/api/v1/batches").json()["total"] == 0
