import pytest

from conftest import (
    CSV_3_VALID_1_INVALID,
    NOTEBOOK_FRAUD_ROW,
    assert_envelope,
    make_prediction,
    upload,
)

URL = "/api/v1/predictions"

# Low risk: an ordinary cash-out that the model scores far below the review threshold.
LOW_ROW = {
    "type": "CASH_OUT",
    "step": 120,
    "amount": 18500.0,
    "oldbalanceOrg": 42300.0,
    "newbalanceOrig": 23800.0,
    "oldbalanceDest": 150000.0,
    "newbalanceDest": 168500.0,
}


def review(client, prediction_id, **body):
    return client.patch(f"{URL}/{prediction_id}/review", json=body)


def predict(client, row=NOTEBOOK_FRAUD_ROW) -> dict:
    return client.post("/api/v1/predict", json=row).json()


def test_flagged_predictions_start_pending_and_low_ones_legitimate(client):
    high = predict(client)
    low = predict(client, LOW_ROW)
    assert (high["risk_level"], low["risk_level"]) == ("high", "low")
    assert client.get(f"{URL}/{high['id']}").json()["review_status"] == "pending"
    assert client.get(f"{URL}/{low['id']}").json()["review_status"] == "legitimate"


def test_batch_rows_get_the_same_defaults(client):
    upload(client, CSV_3_VALID_1_INVALID)  # one high, one review, one low
    by_risk = {i["risk_level"]: i for i in client.get(URL).json()["items"]}
    assert by_risk["high"]["review_status"] == "pending"
    assert by_risk["review"]["review_status"] == "pending"
    assert by_risk["low"]["review_status"] == "legitimate"
    assert all(i["review_note"] is None and i["reviewed_at"] is None for i in by_risk.values())


def test_a_review_returns_the_updated_record(client):
    created = predict(client)
    response = review(client, created["id"], status="confirmed_fraud", note="Customer called us.")
    assert response.status_code == 200
    body = response.json()
    assert body["id"] == created["id"]
    assert body["review_status"] == "confirmed_fraud"
    assert body["review_note"] == "Customer called us."
    assert body["reviewed_at"].endswith("Z")
    assert body["payload"] == NOTEBOOK_FRAUD_ROW  # the rest of the record is untouched
    assert client.get(f"{URL}/{created['id']}").json() == body


def test_a_note_is_optional(client):
    created = predict(client)
    body = review(client, created["id"], status="false_positive").json()
    assert body["review_status"] == "false_positive" and body["review_note"] is None


def test_a_later_review_replaces_the_earlier_one(client):
    created = predict(client)
    first = review(client, created["id"], status="false_positive", note="first impression").json()
    second = review(client, created["id"], status="confirmed_fraud").json()
    assert second["review_status"] == "confirmed_fraud"
    assert second["review_note"] is None
    assert second["reviewed_at"] > first["reviewed_at"]


def test_pending_cannot_be_set_by_hand(client):
    created = predict(client)
    error = assert_envelope(review(client, created["id"], status="pending"), 422, "VALIDATION_ERROR")
    assert error["details"][0]["field"] == "status"
    assert "cannot be set" in error["message"]
    review(client, created["id"], status="legitimate")
    assert_envelope(review(client, created["id"], status="pending"), 422, "VALIDATION_ERROR")
    assert client.get(f"{URL}/{created['id']}").json()["review_status"] == "legitimate"


def test_confirming_fraud_on_a_low_risk_prediction_needs_a_note(client):
    low = predict(client, LOW_ROW)
    error = assert_envelope(review(client, low["id"], status="confirmed_fraud"), 422, "VALIDATION_ERROR")
    assert error["details"] == [
        {"field": "note", "message": "A note is required to confirm fraud on a low-risk prediction."}
    ]
    assert_envelope(
        review(client, low["id"], status="confirmed_fraud", note="   "), 422, "VALIDATION_ERROR"
    )
    # Nothing was written by the rejected attempts.
    assert client.get(f"{URL}/{low['id']}").json()["reviewed_at"] is None

    accepted = review(client, low["id"], status="confirmed_fraud", note="Reported by the customer.")
    assert accepted.status_code == 200 and accepted.json()["review_status"] == "confirmed_fraud"


def test_a_low_risk_prediction_cannot_be_a_false_positive(client):
    low = predict(client, LOW_ROW)
    error = assert_envelope(review(client, low["id"], status="false_positive"), 422, "VALIDATION_ERROR")
    assert error["details"][0]["field"] == "status"


def test_an_unknown_status_is_a_validation_error(client):
    created = predict(client)
    error = assert_envelope(review(client, created["id"], status="maybe"), 422, "VALIDATION_ERROR")
    assert error["details"][0]["field"] == "status"
    assert_envelope(client.patch(f"{URL}/{created['id']}/review", json={}), 422, "VALIDATION_ERROR")


def test_the_note_is_limited_to_500_characters(client):
    created = predict(client)
    assert review(client, created["id"], status="legitimate", note="x" * 500).status_code == 200
    error = assert_envelope(
        review(client, created["id"], status="legitimate", note="x" * 501), 422, "VALIDATION_ERROR"
    )
    assert error["details"][0]["field"] == "note"


def test_a_blank_note_is_stored_as_none_and_a_padded_one_is_trimmed(client):
    created = predict(client)
    assert review(client, created["id"], status="legitimate", note="  ").json()["review_note"] is None
    padded = review(client, created["id"], status="legitimate", note="  ok  ").json()
    assert padded["review_note"] == "ok"


def test_reviewing_an_unknown_prediction_is_a_404_envelope(client):
    error = assert_envelope(review(client, 999, status="legitimate"), 404, "NOT_FOUND")
    assert error["message"] == "Prediction 999 not found."


@pytest.mark.parametrize("bad", ["0", "abc"])
def test_a_malformed_id_is_a_validation_error(client, bad):
    assert_envelope(
        client.patch(f"{URL}/{bad}/review", json={"status": "legitimate"}), 422, "VALIDATION_ERROR"
    )


def test_the_queue_is_the_pending_filter_and_can_be_sorted_by_score(client):
    upload(client, CSV_3_VALID_1_INVALID)  # high, review, low
    predict(client)  # a second high
    queue = client.get(URL, params={"review_status": "pending", "sort": "probability"}).json()
    assert queue["total"] == 3
    scores = [i["probability"] for i in queue["items"]]
    assert scores == sorted(scores, reverse=True)
    assert {i["risk_level"] for i in queue["items"]} == {"high", "review"}

    first = queue["items"][0]["id"]
    review(client, first, status="legitimate")
    assert client.get(URL, params={"review_status": "pending"}).json()["total"] == 2
    assert client.get(URL, params={"review_status": "legitimate"}).json()["total"] == 2  # low + reviewed


def test_sort_is_validated_and_defaults_to_newest(client):
    assert_envelope(client.get(URL, params={"sort": "amount"}), 422, "VALIDATION_ERROR")
    assert_envelope(client.get(URL, params={"review_status": "later"}), 422, "VALIDATION_ERROR")
    first, second = predict(client)["id"], predict(client, LOW_ROW)["id"]
    assert [i["id"] for i in client.get(URL).json()["items"]] == [second, first]


def test_stats_start_with_the_queue_and_no_precision(client):
    upload(client, CSV_3_VALID_1_INVALID)
    assert client.get(f"{URL}/stats").json()["review"] == {
        "pending": 2,
        "reviewed": 0,
        "confirmed_fraud": 0,
        "false_positive": 0,
        "missed_by_model": 0,
        "observed_precision": None,
    }


def test_stats_follow_the_reviews(client):
    ids = [predict(client)["id"] for _ in range(4)]
    low = predict(client, LOW_ROW)["id"]
    for prediction_id, status in zip(ids, ("confirmed_fraud",) * 3 + ("false_positive",), strict=True):
        review(client, prediction_id, status=status)
    review(client, low, status="confirmed_fraud", note="missed")

    stats = client.get(f"{URL}/stats").json()["review"]
    assert stats == {
        "pending": 0,
        "reviewed": 5,
        "confirmed_fraud": 4,
        "false_positive": 1,
        "missed_by_model": 1,
        "observed_precision": 0.75,  # 3 of the 4 flagged records were fraud; the miss is not counted
    }


def test_re_reviewing_moves_the_counts(client):
    created = predict(client)["id"]
    review(client, created, status="confirmed_fraud")
    review(client, created, status="false_positive")
    stats = client.get(f"{URL}/stats").json()["review"]
    assert (stats["confirmed_fraud"], stats["false_positive"], stats["reviewed"]) == (0, 1, 1)
    assert stats["observed_precision"] == 0.0


def test_the_openapi_spec_documents_the_review(client):
    spec = client.get("/openapi.json").json()
    operation = spec["paths"]["/api/v1/predictions/{prediction_id}/review"]["patch"]
    assert {"200", "404", "422"} <= operation["responses"].keys()
    assert operation["requestBody"]["content"]["application/json"]["schema"]["$ref"].endswith("ReviewIn")
    stats = spec["components"]["schemas"]["ReviewStats"]
    stats_doc = " ".join(spec["paths"]["/api/v1/predictions/stats"]["get"]["description"].split())
    assert "not a model metric" in stats_doc
    assert "demo data" in " ".join(stats["properties"]["observed_precision"]["description"].split())
    assert set(spec["components"]["schemas"]["PredictionRecord"]["properties"]) >= {
        "review_status",
        "review_note",
        "reviewed_at",
    }


def test_a_stored_row_without_a_review_time_serializes_as_null(client):
    with client.app.state.sessionmaker() as session:
        record = make_prediction()
        session.add(record)
        session.commit()
        prediction_id = record.id
    body = client.get(f"{URL}/{prediction_id}").json()
    assert body["reviewed_at"] is None and body["review_note"] is None
