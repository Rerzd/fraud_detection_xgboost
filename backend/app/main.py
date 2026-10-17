"""FastAPI application."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.examples import EXAMPLES
from app.model import FraudModel, risk_level
from app.model_card import build_model_card
from app.preprocessing import build_features, features_to_dict
from app.schemas import ExampleOut, HealthOut, PredictionOut, TransactionIn
from app.signals import describe

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


@app.get("/model/info")
def model_info(request: Request) -> dict:
    return build_model_card(get_model(request), request.app.state.settings)


@app.get("/examples", response_model=list[ExampleOut])
def examples() -> list[dict]:
    return EXAMPLES


@app.post("/predict", response_model=PredictionOut)
def predict(tx: TransactionIn, request: Request) -> PredictionOut:
    model = get_model(request)
    settings = request.app.state.settings
    raw = tx.model_dump()
    features = build_features([raw])
    probability = model.predict_proba(features)[0]
    level = risk_level(probability, settings.review_threshold, settings.fraud_threshold)
    return PredictionOut(
        probability=probability,
        risk_level=level,
        is_fraud=level == "high",
        threshold=settings.fraud_threshold,
        features=features_to_dict(features.iloc[0]),
        explanation=model.explain(features),
        signals=describe(raw),
    )
