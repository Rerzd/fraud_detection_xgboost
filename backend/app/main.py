"""FastAPI application factory."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.api import openapi
from app.api.routes import batches, health, model, predictions, scoring
from app.core.config import Settings, get_settings
from app.core.errors import register_exception_handlers
from app.core.logging import configure_logging, kv
from app.core.middleware import PROCESS_TIME_HEADER, REQUEST_ID_HEADER, RequestContextMiddleware
from app.db.session import init_db
from app.ml.model import FraudModel

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings: Settings = app.state.settings
    try:
        model = FraudModel.load(settings.model_path, settings.model_version)
        app.state.model = model
        logger.info(
            kv(event="model_loaded", path=settings.model_path, version=model.version, sha256=model.sha256)
        )
    except Exception:
        logger.exception(kv(event="model_load_failed", path=settings.model_path))
        app.state.model = None
    engine, app.state.sessionmaker = init_db(settings.db_path)
    logger.info(kv(event="database_ready", path=settings.db_path))
    yield
    engine.dispose()


def create_app(settings: Settings | None = None) -> FastAPI:
    """Build the application. Tests pass their own `settings`; the server uses the environment."""
    settings = settings or get_settings()
    configure_logging(settings.log_level)
    app = FastAPI(
        title=openapi.TITLE,
        version=openapi.VERSION,
        description=openapi.DESCRIPTION,
        license_info=openapi.LICENSE,
        openapi_tags=openapi.TAGS,
        swagger_ui_parameters=openapi.SWAGGER_UI_PARAMETERS,
        generate_unique_id_function=openapi.unique_id,
        lifespan=lifespan,
    )
    app.state.settings = settings
    register_exception_handlers(app)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=[REQUEST_ID_HEADER, PROCESS_TIME_HEADER],
    )
    app.add_middleware(RequestContextMiddleware)
    for router in (health.router, model.router, scoring.router, batches.router, predictions.router):
        app.include_router(router, prefix=openapi.API_PREFIX)

    @app.get("/", include_in_schema=False)
    def root() -> RedirectResponse:
        return RedirectResponse("/docs")

    return app


app = create_app()
