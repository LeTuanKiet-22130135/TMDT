import strawberry
from strawberry.types import Info
from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, BackgroundTasks
from typing import cast

from uuid import UUID
from app.models import ShoppingCart, User, Store, Product, Report, ReportStatusEnum, RoleEnum
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.api.v1.auth import _queue_verification_email
import random
from datetime import datetime, timedelta, timezone
from app.graphql.types import (
    to_user_type,
    to_product_type,
    to_store_type,
    to_report_type,
    UserType,
    ProductType,
    StoreType,
    ReportType,
)
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

    @strawberry.mutation
    def banUser(self, info: Info, userId: UUID) -> UserType:
        user = info.context.get("current_user")
        if user is None or user.role != RoleEnum.ADMIN:
            raise Exception("Not authorized")
        
        db = _db(info)
        target_user = db.get(User, userId)
        if target_user is None:
            raise Exception("User not found")
            
        target_user.is_active = False
        db.add(target_user)
        db.commit()
        db.refresh(target_user)
        return to_user_type(target_user)

    @strawberry.mutation
    def unbanUser(self, info: Info, userId: UUID) -> UserType:
        user = info.context.get("current_user")
        if user is None or user.role != RoleEnum.ADMIN:
            raise Exception("Not authorized")
        
        db = _db(info)
        target_user = db.get(User, userId)
        if target_user is None:
            raise Exception("User not found")
            
        target_user.is_active = True
        db.add(target_user)
        db.commit()
        db.refresh(target_user)
        return to_user_type(target_user)

    @strawberry.mutation
    def adminToggleProduct(self, info: Info, productId: UUID) -> ProductType:
        user = info.context.get("current_user")
        if user is None or user.role != RoleEnum.ADMIN:
            raise Exception("Not authorized")
        
        db = _db(info)
        product = db.get(Product, productId)
        if product is None:
            raise Exception("Product not found")
            
        product.is_active = not product.is_active
        db.add(product)
        db.commit()
        db.refresh(product)
        return to_product_type(product)

    @strawberry.mutation
    def adminToggleStore(self, info: Info, storeId: UUID) -> StoreType:
        user = info.context.get("current_user")
        if user is None or user.role != RoleEnum.ADMIN:
            raise Exception("Not authorized")
        
        db = _db(info)
        store = db.get(Store, storeId)
        if store is None:
            raise Exception("Store not found")
            
        store.is_active = not store.is_active
        db.add(store)
        db.commit()
        db.refresh(store)
        return to_store_type(store)

    @strawberry.mutation
    def resolveReport(self, info: Info, reportId: UUID) -> ReportType:
        user = info.context.get("current_user")
        if user is None or user.role != RoleEnum.ADMIN:
            raise Exception("Not authorized")
        
        db = _db(info)
        report = db.get(Report, reportId)
        if report is None:
            raise Exception("Report not found")
            
        report.status = ReportStatusEnum.RESOLVED
        db.add(report)
        db.commit()
        db.refresh(report)
        return to_report_type(report)

