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


def get_model_service(request: Request) -> FraudModel:
    model = request.app.state.model
    if model is None:
        raise ModelUnavailableError("The model is not loaded, so nothing can be scored.")
    return model


SettingsDep = Annotated[Settings, Depends(get_settings)]
DbDep = Annotated[Session, Depends(get_db)]
ModelDep = Annotated[FraudModel, Depends(get_model_service)]
