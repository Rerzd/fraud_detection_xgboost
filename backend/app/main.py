"""FastAPI application factory."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import batches, health, model, predictions, scoring
from app.core.config import Settings, get_settings
from app.db.session import init_db
from app.ml.model import FraudModel

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings: Settings = app.state.settings
    try:
        app.state.model = FraudModel.load(settings.model_path, settings.model_version)
    except Exception:
        logger.exception("Could not load model from %s", settings.model_path)
        app.state.model = None
    engine, app.state.sessionmaker = init_db(settings.db_path)
    yield
    engine.dispose()


def create_app(settings: Settings | None = None) -> FastAPI:
    """Build the application. Tests pass their own `settings`; the server uses the environment."""
    settings = settings or get_settings()
    app = FastAPI(title="Fraud Detection API", version="1.0.0", lifespan=lifespan)
    app.state.settings = settings
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    for router in (health.router, model.router, scoring.router, batches.router, predictions.router):
        app.include_router(router)
    return app


app = create_app()
