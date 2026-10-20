"""FastAPI dependencies. Tests override these through `app.dependency_overrides`."""

from collections.abc import Iterator
from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.errors import ModelUnavailableError
from app.ml.model import FraudModel


def get_settings(request: Request) -> Settings:
    return request.app.state.settings


def get_db(request: Request) -> Iterator[Session]:
    """One SQLAlchemy session per request."""
    with request.app.state.sessionmaker() as session:
        yield session


def get_optional_model(request: Request) -> FraudModel | None:
    """The loaded model, or None when it failed to load. Health checks use this."""
    return request.app.state.model


def get_model_service(model: Annotated[FraudModel | None, Depends(get_optional_model)]) -> FraudModel:
    if model is None:
        raise ModelUnavailableError("The model is not loaded, so nothing can be scored.")
    return model


def get_request_id(request: Request) -> str | None:
    """The id set by `RequestContextMiddleware`, stored with every prediction the call creates."""
    return getattr(request.state, "request_id", None)


SettingsDep = Annotated[Settings, Depends(get_settings)]
DbDep = Annotated[Session, Depends(get_db)]
ModelDep = Annotated[FraudModel, Depends(get_model_service)]
OptionalModelDep = Annotated[FraudModel | None, Depends(get_optional_model)]
RequestIdDep = Annotated[str | None, Depends(get_request_id)]
