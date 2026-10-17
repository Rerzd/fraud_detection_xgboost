import pytest
from fastapi.testclient import TestClient

from app.main import app

# The notebook's known fraud row (Xtest index 6020168) in raw, pre-preprocessing form.
NOTEBOOK_FRAUD_ROW = {
    "type": "TRANSFER",
    "step": 459,
    "amount": 1153156.0,
    "oldbalanceOrg": 1153156.0,
    "newbalanceOrig": 0.0,
    "oldbalanceDest": 0.0,
    "newbalanceDest": 0.0,
}


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c
