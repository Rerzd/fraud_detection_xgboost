"""FastAPI application."""

import logging
import uuid
from collections.abc import Iterator
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app import repository
from app.batch import REQUIRED_COLUMNS, BatchError, parse_csv
from app.config import Settings, get_settings
from app.db import init_db
from app.examples import EXAMPLES
from app.model import FraudModel, risk_level
from app.model_card import build_model_card
from app.preprocessing import build_features, features_to_dict
from app.schemas import (
    BatchLimits,
    BatchOut,
    ExampleOut,
    HealthOut,
    HistoryItem,
    PredictionOut,
    RiskLevel,
    StatsOut,
    TransactionIn,
)
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
    engine, app.state.sessionmaker = init_db(settings.db_path)
    yield
    engine.dispose()


app = FastAPI(title="Fraud Detection API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_settings_dep(request: Request) -> Settings:
    return request.app.state.settings


def get_model(request: Request) -> FraudModel:
    model = request.app.state.model
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    return model


def get_session(request: Request) -> Iterator[Session]:
    with request.app.state.sessionmaker() as session:
        yield session


SettingsDep = Annotated[Settings, Depends(get_settings_dep)]
ModelDep = Annotated[FraudModel, Depends(get_model)]
SessionDep = Annotated[Session, Depends(get_session)]


@app.get("/health", response_model=HealthOut)
def health(request: Request) -> HealthOut:
    model = request.app.state.model
    return HealthOut(
        status="ok",
        model_loaded=model is not None,
        model_version=model.version if model else None,
    )


@app.get("/model/info")
def model_info(model: ModelDep, settings: SettingsDep) -> dict:
    return build_model_card(model, settings)


@app.get("/examples", response_model=list[ExampleOut])
def examples() -> list[dict]:
    return EXAMPLES


@app.post("/predict", response_model=PredictionOut)
def predict(tx: TransactionIn, model: ModelDep, settings: SettingsDep, session: SessionDep):
    raw = tx.model_dump()
    features = build_features([raw])
    probability = model.predict_proba(features)[0]
    level = risk_level(probability, settings.review_threshold, settings.fraud_threshold)
    repository.insert(session, raw, probability, level)
    return PredictionOut(
        probability=probability,
        risk_level=level,
        is_fraud=level == "high",
        threshold=settings.fraud_threshold,
        features=features_to_dict(features.iloc[0]),
        explanation=model.explain(features),
        signals=describe(raw),
    )


@app.get("/predict/batch/limits", response_model=BatchLimits)
def batch_limits(settings: SettingsDep) -> BatchLimits:
    return BatchLimits(
        max_rows=settings.batch_max_rows,
        max_bytes=settings.batch_max_bytes,
        required_columns=REQUIRED_COLUMNS,
    )


@app.post("/predict/batch", response_model=BatchOut)
async def predict_batch(file: UploadFile, model: ModelDep, settings: SettingsDep, session: SessionDep):
    content = await file.read(settings.batch_max_bytes + 1)
    if len(content) > settings.batch_max_bytes:
        limit_mb = settings.batch_max_bytes / (1024 * 1024)
        raise HTTPException(status_code=413, detail=f"File too large: the limit is {limit_mb:g} MB.")
    try:
        valid, errors = parse_csv(content, settings.batch_max_rows)
    except BatchError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    rows: list[dict] = []
    if valid:
        probabilities = model.predict_proba(build_features(tx for _, tx in valid))
        for (line, tx), p in zip(valid, probabilities):
            level = risk_level(p, settings.review_threshold, settings.fraud_threshold)
            rows.append({"row": line, **tx, "probability": p, "risk_level": level})

    batch_id = uuid.uuid4().hex
    if rows:
        repository.bulk_insert(
            session,
            [({k: r[k] for k in TransactionIn.model_fields}, r["probability"], r["risk_level"]) for r in rows],
            batch_id,
        )

    risk_counts = {"low": 0, "review": 0, "high": 0}
    for r in rows:
        risk_counts[r["risk_level"]] += 1
    rows.sort(key=lambda r: r["probability"], reverse=True)
    return {
        "batch_id": batch_id,
        "summary": {
            "total": len(rows) + len(errors),
            "scored": len(rows),
            "invalid": len(errors),
            "risk_counts": risk_counts,
            "flagged_rate": risk_counts["high"] / len(rows) if rows else 0.0,
        },
        "rows": rows,
        "errors": errors,
    }


@app.get("/predictions", response_model=list[HistoryItem])
def list_predictions(
    session: SessionDep,
    limit: Annotated[int, Query(ge=1, le=500)] = 50,
    risk_level: RiskLevel | None = None,
):
    return repository.list_recent(session, limit, risk_level)


@app.get("/predictions/stats", response_model=StatsOut)
def prediction_stats(session: SessionDep):
    return repository.stats(session)


@app.delete("/predictions")
def clear_predictions(session: SessionDep) -> dict:
    return {"deleted": repository.clear(session)}
