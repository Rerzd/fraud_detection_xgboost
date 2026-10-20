import pytest

from conftest import CSV_3_VALID_1_INVALID, HEADER, assert_envelope, csv_of, upload


def test_batch_scores_valid_rows_and_reports_errors(client):
    body = upload(client, CSV_3_VALID_1_INVALID).json()
    summary = body["summary"]
    assert summary["total"] == 4
    assert summary["scored"] == 3
    assert summary["invalid"] == 1
    assert summary["risk_counts"] == {"high": 1, "review": 1, "low": 1}
    assert summary["flagged_rate"] == 1 / 3
    assert body["errors"] == [{"row": 4, "reason": body["errors"][0]["reason"]}]
    assert body["errors"][0]["reason"].startswith("type:")
    probabilities = [r["probability"] for r in body["rows"]]
    assert probabilities == sorted(probabilities, reverse=True)

    history = client.get("/api/v1/predictions").json()["items"]
    assert len(history) == 3
    assert {h["source"] for h in history} == {"batch"}
    assert {h["batch_id"] for h in history} == {body["batch_id"]}


def test_batch_missing_columns_is_rejected(client):
    response = upload(client, "type,step,amount\nTRANSFER,1,100")
    assert response.status_code == 422
    error = response.json()["error"]
    assert error["code"] == "INVALID_CSV"
    assert "Missing required columns" in error["message"]


def test_batch_row_limit(make_client):
    response = upload(make_client(batch_max_rows=2), CSV_3_VALID_1_INVALID)
    assert response.status_code == 413
    error = response.json()["error"]
    assert error["code"] == "BATCH_TOO_LARGE"
    assert "Too many rows" in error["message"]


def test_batch_size_limit(make_client):
    response = upload(make_client(batch_max_bytes=50), CSV_3_VALID_1_INVALID)
    assert response.status_code == 413


def test_batch_limits_come_from_config(make_client):
    body = make_client(batch_max_rows=123).get("/api/v1/predict/batch/limits").json()
    assert body["max_rows"] == 123
    assert body["max_bytes"] == 5 * 1024 * 1024
    assert body["required_columns"] == HEADER.split(",")


def test_a_batch_run_is_recorded(client, model):
    body = upload(client, CSV_3_VALID_1_INVALID, name="march.csv").json()
    record = client.get(f"/api/v1/batches/{body['batch_id']}").json()
    assert record["id"] == body["batch_id"]
    assert record["filename"] == "march.csv" == body["filename"]
    assert (record["total_rows"], record["scored"], record["invalid"], record["flagged"]) == (
        4,
        3,
        1,
        1,
    )
    assert record["model_version"] == "xgb-paysim-v1"
    assert record["model_hash"] == model.sha256[:12]
    assert record["created_at"].endswith("Z")


def test_batches_are_listed_newest_first_and_paginated(client):
    first = upload(client, csv_of(1), name="a.csv").json()["batch_id"]
    second = upload(client, csv_of(2), name="b.csv").json()["batch_id"]
    third = upload(client, csv_of(3), name="c.csv").json()["batch_id"]

    page = client.get("/api/v1/batches").json()
    assert page.keys() == {"items", "total", "limit", "offset"}
    assert [b["id"] for b in page["items"]] == [third, second, first]
    assert page["total"] == 3

    second_page = client.get("/api/v1/batches", params={"limit": 2, "offset": 2}).json()
    assert [b["id"] for b in second_page["items"]] == [first]
    assert second_page["total"] == 3


def test_a_file_with_only_invalid_rows_is_still_a_recorded_run(client):
    body = upload(client, HEADER + "\nPAYMENT,1,1,1,1,1,1\nPAYMENT,2,2,2,2,2,2").json()
    assert body["summary"]["scored"] == 0
    record = client.get(f"/api/v1/batches/{body['batch_id']}").json()
    assert (record["total_rows"], record["scored"], record["invalid"], record["flagged"]) == (
        2,
        0,
        2,
        0,
    )
    assert (
        client.get("/api/v1/predictions", params={"batch_id": body["batch_id"]}).json()["total"]
        == 0
    )


def test_a_rejected_file_leaves_no_batch_behind(client, make_client):
    upload(client, "type,step\nTRANSFER,1")
    upload(make_client(batch_max_rows=1), CSV_3_VALID_1_INVALID)
    assert client.get("/api/v1/batches").json()["total"] == 0


def test_the_rows_of_a_batch_are_found_by_its_id(client):
    body = upload(client, CSV_3_VALID_1_INVALID).json()
    rows = client.get("/api/v1/predictions", params={"batch_id": body["batch_id"]}).json()
    assert rows["total"] == 3 == body["summary"]["scored"]


def test_an_unknown_batch_is_a_404_envelope(client):
    unknown = "0" * 32
    error = assert_envelope(client.get(f"/api/v1/batches/{unknown}"), 404, "NOT_FOUND")
    assert error["message"] == f"Batch {unknown} not found."


@pytest.mark.parametrize("bad", ["abc", "G" * 32, "0" * 31])
def test_a_malformed_batch_id_is_a_validation_error(client, bad):
    assert_envelope(client.get(f"/api/v1/batches/{bad}"), 422, "VALIDATION_ERROR")


def test_batch_page_size_is_bounded(client):
    assert_envelope(client.get("/api/v1/batches", params={"limit": 201}), 422, "VALIDATION_ERROR")
    assert client.get("/api/v1/batches", params={"limit": 200}).status_code == 200


def test_the_uploaded_name_is_stored_as_a_plain_file_name(client):
    for sent, stored in (
        ("../../etc/passwd.csv", "passwd.csv"),
        ("C:\\Users\\me\\data.csv", "data.csv"),
        ("x" * 300 + ".csv", ("x" * 300 + ".csv")[:255]),
    ):
        body = upload(client, csv_of(1), name=sent).json()
        assert body["filename"] == stored
