from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
import bcrypt

from app.core.config import settings


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except ValueError:
        return False


def create_token(subject: str, expires_delta: timedelta, token_type: str) -> str:
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": subject,
        "type": token_type,
        "iat": int(now.timestamp()),
        "exp": int((now + expires_delta).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_access_token(subject: str) -> str:
    return create_token(subject, timedelta(minutes=settings.access_token_expire_minutes), "access")


def create_refresh_token(subject: str) -> str:
    return create_token(subject, timedelta(days=settings.refresh_token_expire_days), "refresh")


def create_email_verification_token(subject: str) -> str:
    return create_token(subject, timedelta(minutes=settings.verification_token_expire_minutes), "verify_email")


def create_password_reset_token(subject: str) -> str:
    return create_token(subject, timedelta(minutes=settings.reset_token_expire_minutes), "reset_password")


def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])


def get_token_subject(token: str, expected_type: str | None = None) -> str:
    payload = decode_token(token)
    if expected_type is not None and payload.get("type") != expected_type:
        raise JWTError("Invalid token type")

    subject = payload.get("sub")
    if not subject:
        raise JWTError("Invalid token subject")

    return subject
