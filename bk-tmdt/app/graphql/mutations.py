import strawberry
from strawberry.types import Info
from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, BackgroundTasks
from typing import cast

from app.models import ShoppingCart, User
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.api.v1.auth import _queue_verification_email
import random
from datetime import datetime, timedelta, timezone
from app.graphql.types import to_user_type
from app.graphql.auth_types import TokenType

def _db(info: Info) -> Session:
    return info.context["db"]

def _background_tasks(info: Info) -> BackgroundTasks:
    return info.context["background_tasks"]

@strawberry.type
class AuthMutation:
    @strawberry.mutation
    def register(
        self, info: Info, email: str, password: str, full_name: str
    ) -> TokenType:
        db = _db(info)
        background_tasks = _background_tasks(info)
        
        existing_user = db.scalar(select(User).where(User.email == email))
        if existing_user is not None:
            raise Exception("Email already registered")

        user = User(
            email=email,
            password_hash=hash_password(password),
            full_name=full_name,
            is_verified=False,
        )
        db.add(user)
        db.flush()
        db.add(ShoppingCart(user_id=user.id))
        db.commit()
        db.refresh(user)

        otp = f"{random.randint(100000, 999999)}"
        user.verification_otp = otp
        user.verification_otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
        db.commit()
        db.refresh(user)

        background_tasks.add_task(_queue_verification_email, user.email, user.full_name, otp)

        return TokenType(
            access_token=create_access_token(str(user.id)),
            refresh_token=create_refresh_token(str(user.id)),
            user=to_user_type(user),
        )

    @strawberry.mutation
    def login(self, info: Info, email: str, password: str) -> TokenType:
        db = _db(info)
        user = db.scalar(select(User).where(User.email == email))
        if user is None or user.password_hash is None or not verify_password(password, user.password_hash):
            raise Exception("Invalid credentials")

        return TokenType(
            access_token=create_access_token(str(user.id)),
            refresh_token=create_refresh_token(str(user.id)),
            user=to_user_type(user),
        )
    @strawberry.mutation
    def verifyOtp(self, info: Info, email: str, otp: str) -> bool:
        from datetime import datetime, timezone
        db = _db(info)
        user = db.scalar(select(User).where(User.email == email))
        if user is None:
            raise Exception("User not found")
        
        if user.is_verified:
            return True
            
        if not user.verification_otp or user.verification_otp != otp:
            raise Exception("Invalid OTP")
            
        if user.verification_otp_expires_at and user.verification_otp_expires_at < datetime.now(timezone.utc):
            raise Exception("OTP expired")
            
        user.is_verified = True
        user.verification_otp = None
        user.verification_otp_expires_at = None
        db.commit()
        return True
