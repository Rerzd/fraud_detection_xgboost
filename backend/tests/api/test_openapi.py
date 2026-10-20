import pytest

from conftest import NOTEBOOK_FRAUD_ROW

HTTP_METHODS = {"get", "post", "put", "patch", "delete"}


@pytest.fixture
def spec(client):
    return client.get("/openapi.json").json()


def operations(spec):
    for path, item in spec["paths"].items():
        for method, operation in item.items():
            if method in HTTP_METHODS:
                yield method.upper(), path, operation


def test_info_describes_the_api(spec):
    info = spec["info"]
    assert info["title"] == "Fraud Detection API"
    assert info["version"] == "1.0.0"
    assert info["license"]["name"] == "MIT"
    for topic in ("PaySim", "Risk levels", "Errors", "X-Request-ID"):
        assert topic in info["description"]


def test_every_route_has_a_summary_a_tag_and_a_description(spec):
    for method, path, op in operations(spec):
        assert op.get("summary"), f"{method} {path} has no summary"
        assert op.get("tags"), f"{method} {path} has no tag"
        assert op.get("description"), f"{method} {path} has no description"


def test_every_tag_in_use_is_described(spec):
    described = {t["name"]: t.get("description") for t in spec["tags"]}
    used = {tag for _, _, op in operations(spec) for tag in op["tags"]}
    assert used <= described.keys()
    assert all(described[t] for t in used)


def test_operation_ids_are_the_function_names(spec):
    ids = [op["operationId"] for _, _, op in operations(spec)]
    assert len(ids) == len(set(ids))
    assert {"health", "predict", "predict_batch", "list_predictions", "model_info"} <= set(ids)


def error_schema_ref(response):
    return response["content"]["application/json"]["schema"]["$ref"]


def test_error_responses_use_the_shared_envelope(spec):
    ref = "#/components/schemas/ErrorResponse"
    predict = spec["paths"]["/api/v1/predict"]["post"]["responses"]
    assert {"200", "422", "503"} <= predict.keys()
    assert error_schema_ref(predict["422"]) == ref
    assert error_schema_ref(predict["503"]) == ref
    batch = spec["paths"]["/api/v1/predict/batch"]["post"]["responses"]
    assert {"413", "422", "503"} <= batch.keys()
    assert error_schema_ref(batch["413"]) == ref
    assert "HTTPValidationError" not in spec["components"]["schemas"]


def test_documented_error_examples_follow_the_envelope(spec):
    from app.schemas.common import ErrorResponse

    for _, _, op in operations(spec):
        for status, response in op["responses"].items():
            if status == "200":
                continue
            for example in response["content"]["application/json"]["examples"].values():
                ErrorResponse.model_validate(example["value"])


def test_predict_documents_the_notebook_fraud_row(spec):
    schema = spec["components"]["schemas"]["TransactionIn"]
    assert schema["examples"] == [NOTEBOOK_FRAUD_ROW]
    out = spec["components"]["schemas"]["PredictionOut"]["examples"][0]
    assert out["risk_level"] == "high" and out["is_fraud"] is True
    assert len(out["explanation"]["contributions"]) == 9


def test_the_prediction_example_matches_what_the_model_returns(client, spec):
    example = spec["components"]["schemas"]["PredictionOut"]["examples"][0]
    live = client.post("/api/v1/predict", json=NOTEBOOK_FRAUD_ROW).json()
    assert example["probability"] == pytest.approx(live["probability"], abs=1e-6)
    assert example["features"] == live["features"]
    assert example["signals"] == live["signals"]
    assert example["explanation"]["base_value"] == pytest.approx(
        live["explanation"]["base_value"], abs=1e-3
    )
    for shown, real in zip(
        example["explanation"]["contributions"], live["explanation"]["contributions"], strict=True
    ):
        assert shown["feature"] == real["feature"]
        assert shown["contribution"] == pytest.approx(real["contribution"], abs=1e-3)


def test_listings_are_documented_as_pages(spec):
    paths = spec["paths"]
    predictions = paths["/api/v1/predictions"]["get"]["responses"]["200"]["content"][
        "application/json"
    ]
    batches = paths["/api/v1/batches"]["get"]["responses"]["200"]["content"]["application/json"]
    assert predictions["schema"]["$ref"].endswith("Page_PredictionRecord_")
    assert batches["schema"]["$ref"].endswith("Page_BatchRecord_")
    page = spec["components"]["schemas"]["Page_PredictionRecord_"]
    assert set(page["properties"]) == {"items", "total", "limit", "offset"}


def test_the_prediction_filters_are_documented(spec):
    params = {p["name"]: p for p in spec["paths"]["/api/v1/predictions"]["get"]["parameters"]}
    assert set(params) == {
        "limit",
        "offset",
        "risk_level",
        "source",
        "batch_id",
        "review_status",
        "created_from",
        "created_to",
        "sort",
    }
    assert params["limit"]["schema"]["maximum"] == 200
    assert all(p.get("description") for p in params.values())


def test_the_lookup_routes_document_their_404(spec):
    for path in ("/api/v1/predictions/{prediction_id}", "/api/v1/batches/{batch_id}"):
        responses = spec["paths"][path]["get"]["responses"]
        assert {"200", "404", "422"} <= responses.keys()
        assert error_schema_ref(responses["404"]) == "#/components/schemas/ErrorResponse"


def test_the_stored_prediction_id_is_part_of_the_scoring_response(spec):
    out = spec["components"]["schemas"]["PredictionOut"]
    assert "id" in out["properties"] and out["examples"][0]["id"] == 1


def test_docs_pages_are_served(client):
    assert "swagger" in client.get("/docs").text.lower()
    assert "redoc" in client.get("/redoc").text.lower()


def test_root_redirects_to_the_docs(client):
    response = client.get("/", follow_redirects=False)
    assert response.status_code in (302, 307) and response.headers["location"] == "/docs"
