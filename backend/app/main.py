"""FastAPI application."""

import logging
from contextlib import asynccontextmanager

import pandas as pd
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.model import FraudModel
from app.schemas import HealthOut, PredictionOut, TransactionIn

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    app.state.settings = settings
    try:
        app.state.model = FraudModel.load(settings.model_path, settings.model_version)
    except Exception:
        logger.exception("Could not load model from %s", settings.model_path)
        app.state.model = None
    yield


app = FastAPI(title="Fraud Detection API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_model(request: Request) -> FraudModel:
    model = request.app.state.model
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    return model


@app.get("/health", response_model=HealthOut)
def health(request: Request) -> HealthOut:
    model = request.app.state.model
    return HealthOut(
        status="ok",
        model_loaded=model is not None,
        model_version=model.version if model else None,
    )


@app.post("/predict", response_model=PredictionOut)
def predict(tx: TransactionIn, request: Request) -> PredictionOut:
    model = get_model(request)
    probability = model.predict_proba(pd.DataFrame([tx.model_dump()]))[0]
    return PredictionOut(fraud=probability > 0.5, probability=round(probability, 4))
