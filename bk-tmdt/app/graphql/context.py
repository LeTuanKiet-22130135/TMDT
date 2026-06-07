from collections.abc import Mapping
from typing import Any

from fastapi import Depends, Request
from jose import JWTError
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.core.security import get_token_subject
from app.models import User


def _extract_bearer_token(request: Request) -> str | None:
    authorization = request.headers.get("Authorization")
    if not authorization:
        return None

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return None
    return token


def _resolve_current_user(request: Request, db: Session) -> User | None:
    token = _extract_bearer_token(request)
    if token is None:
        return None

    try:
        user_id = get_token_subject(token, expected_type="access")
    except JWTError:
        return None

    user = db.get(User, user_id)
    if user is None or not user.is_active:
        return None
    return user


def get_graphql_context(request: Request, db: Session = Depends(get_db)) -> Mapping[str, Any]:
    return {
        "request": request,
        "db": db,
        "current_user": _resolve_current_user(request, db),
    }