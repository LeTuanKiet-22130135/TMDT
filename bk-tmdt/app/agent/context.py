"""
Agent GraphQL Context

Bảo mật 2 lớp:
  1. X-Agent-Key header — phải khớp với AGENT_API_KEY trong config
  2. Authorization: Bearer <token> — resolve current user (nếu có)
"""
from collections.abc import Mapping
from typing import Any

from fastapi import Depends, HTTPException, Request, status
from jose import JWTError
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.core.config import settings
from app.core.security import get_token_subject
from app.models import User


def _validate_agent_key(request: Request) -> None:
    """Kiểm tra X-Agent-Key header. Ném 403 nếu thiếu hoặc sai."""
    key = request.headers.get("X-Agent-Key")
    if not key or key != settings.agent_api_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing X-Agent-Key header",
        )


def _resolve_bearer_user(request: Request, db: Session) -> User | None:
    """Lấy current user từ Authorization: Bearer token (nếu có)."""
    authorization = request.headers.get("Authorization")
    if not authorization:
        return None

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return None

    try:
        user_id = get_token_subject(token, expected_type="access")
        from uuid import UUID
        user_uuid = UUID(user_id)
    except (JWTError, ValueError):
        return None

    user = db.get(User, user_uuid)
    if user is None or not user.is_active:
        return None
    return user


def get_agent_context(
    request: Request,
    db: Session = Depends(get_db),
) -> Mapping[str, Any]:
    """Context getter cho agent GraphQL router."""
    # Lớp 1: Xác thực agent key — bắt buộc
    _validate_agent_key(request)

    # Lớp 2: Resolve user từ Bearer token (optional — một số mutation cần)
    current_user = _resolve_bearer_user(request, db)

    return {
        "request": request,
        "db": db,
        "current_user": current_user,
    }
