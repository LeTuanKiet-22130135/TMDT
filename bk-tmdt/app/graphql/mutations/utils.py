import string
import secrets
from strawberry.types import Info
from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi import BackgroundTasks
from app.models import User

_SHORTLINK_ALPHABET = string.ascii_lowercase + string.digits

def _generate_shortlink(db: Session, length: int = 10) -> str:
    while True:
        sl = ''.join(secrets.choice(_SHORTLINK_ALPHABET) for _ in range(length))
        if not db.scalar(select(User).where(User.shortlink == sl)):
            return sl

def _db(info: Info) -> Session:
    return info.context["db"]

def _background_tasks(info: Info) -> BackgroundTasks:
    return info.context["background_tasks"]

def require_auth(info: Info) -> User:
    user = info.context.get("current_user")
    if not user:
        raise Exception("Authentication required")
    return user
