from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd

# App

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the model
pipeline = joblib.load("fraud_model.pkl")

# Schema
class Transaction(BaseModel):
    step: int
    type: int
    amount: float
    oldbalanceOrg: float
    newbalanceOrig: float
    oldbalanceDest: float
    newbalanceDest: float
    errorbalanceDest: float
    errorbalanceOrig: float

# Endpoints

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict")
def predict(tx: Transaction):
    data = pd.DataFrame([tx.dict()])
    prob = pipeline.predict_proba(data)[0][1]
    return {
        "fraud": bool(prob > 0.5),
        "probability": round(float(prob), 4)
    }