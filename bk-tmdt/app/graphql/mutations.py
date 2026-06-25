import asyncio
import os
import secrets
import string
import strawberry
from strawberry.types import Info
from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, BackgroundTasks
from typing import Optional, cast
import httpx

_SHORTLINK_ALPHABET = string.ascii_lowercase + string.digits


def _generate_shortlink(db: Session, length: int = 10) -> str:
    while True:
        sl = ''.join(secrets.choice(_SHORTLINK_ALPHABET) for _ in range(length))
        if not db.scalar(select(User).where(User.shortlink == sl)):
            return sl

from uuid import UUID
from app.models import ShoppingCart, User, Store, Product, Category, Report, ReportStatusEnum, RoleEnum

CACAO_BASE_URL = os.getenv("CACAO_URL", "http://localhost:8001")
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
            raise Exception("Email này đã được đăng ký")

        user = User(
            email=email,
            password_hash=hash_password(password),
            full_name=full_name,
            is_verified=False,
            shortlink=_generate_shortlink(db),
        )
        db.add(user)
        db.flush()
        db.add(ShoppingCart(user_id=user.id))
        store_name = f"{full_name.strip()} ({email.split('@')[0]})"
        db.add(Store(owner_id=user.id, name=store_name))
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
            raise Exception("Email hoặc mật khẩu không đúng")

        return TokenType(
            access_token=create_access_token(str(user.id)),
            refresh_token=create_refresh_token(str(user.id)),
            user=to_user_type(user),
        )
    @strawberry.mutation
    def verifyOtp(self, info: Info, email: str, otp: str) -> bool:
        from datetime import datetime, timezone
        from app.core.config import settings

        db = _db(info)
        user = db.scalar(select(User).where(User.email == email))
        if user is None:
            raise Exception("Không tìm thấy tài khoản")

        if user.is_verified:
            return True

        # ── Test mode bypass ─────────────────────────────────────────────────
        # Khi TEST_MODE=true trong .env, OTP magic "000000" luôn được chấp nhận.
        # KHÔNG BAO GIỜ bật tính năng này trên production.
        # ─────────────────────────────────────────────────────────────────────
        if settings.test_mode and otp == "000000":
            user.is_verified = True
            user.verification_otp = None
            user.verification_otp_expires_at = None
            db.commit()
            return True

        if not user.verification_otp or user.verification_otp != otp:
            raise Exception("Mã OTP không đúng")

        if user.verification_otp_expires_at and user.verification_otp_expires_at < datetime.now(timezone.utc):
            raise Exception("Mã OTP đã hết hạn")
            
        user.is_verified = True
        user.verification_otp = None
        user.verification_otp_expires_at = None
        db.commit()
        return True


    @strawberry.mutation
    def banUser(self, info: Info, userId: UUID) -> UserType:
        user = info.context.get("current_user")
        if user is None or user.role != RoleEnum.ADMIN:
            raise Exception("Không có quyền thực hiện thao tác này")
        
        db = _db(info)
        target_user = db.get(User, userId)
        if target_user is None:
            raise Exception("Không tìm thấy người dùng")
            
        target_user.is_active = False
        db.add(target_user)
        db.commit()
        db.refresh(target_user)
        return to_user_type(target_user)

    @strawberry.mutation
    def unbanUser(self, info: Info, userId: UUID) -> UserType:
        user = info.context.get("current_user")
        if user is None or user.role != RoleEnum.ADMIN:
            raise Exception("Không có quyền thực hiện thao tác này")
        
        db = _db(info)
        target_user = db.get(User, userId)
        if target_user is None:
            raise Exception("Không tìm thấy người dùng")
            
        target_user.is_active = True
        db.add(target_user)
        db.commit()
        db.refresh(target_user)
        return to_user_type(target_user)

    @strawberry.mutation
    def adminToggleProduct(self, info: Info, productId: UUID) -> ProductType:
        user = info.context.get("current_user")
        if user is None or user.role != RoleEnum.ADMIN:
            raise Exception("Không có quyền thực hiện thao tác này")
        
        db = _db(info)
        product = db.get(Product, productId)
        if product is None:
            raise Exception("Không tìm thấy sản phẩm")
            
        product.is_active = not product.is_active
        db.add(product)
        db.commit()
        db.refresh(product)
        return to_product_type(product)

    @strawberry.mutation
    def adminToggleStore(self, info: Info, storeId: UUID) -> StoreType:
        user = info.context.get("current_user")
        if user is None or user.role != RoleEnum.ADMIN:
            raise Exception("Không có quyền thực hiện thao tác này")
        
        db = _db(info)
        store = db.get(Store, storeId)
        if store is None:
            raise Exception("Không tìm thấy cửa hàng")
            
        store.is_active = not store.is_active
        db.add(store)
        db.commit()
        db.refresh(store)
        return to_store_type(store)

    @strawberry.mutation
    def create_product(
        self,
        info: Info,
        name: str,
        description: str,
        price: float,
        image_urls: list[str],
        category_id: Optional[UUID] = None,
        main_file_url: Optional[str] = None,
        user_tags: Optional[list[str]] = None,
        license_type: Optional[str] = "personal",
        software_tags: Optional[list[str]] = None,
        format_tags: Optional[list[str]] = None,
        stock_quantity: int = 999,
    ) -> ProductType:
        user = info.context.get("current_user")
        if user is None:
            raise Exception("Bạn chưa đăng nhập")

        db = _db(info)
        store = db.scalar(select(Store).where(Store.owner_id == user.id))
        if store is None:
            store_name = f"{user.full_name.strip()} ({user.email.split('@')[0]})"
            store = Store(owner_id=user.id, name=store_name)
            db.add(store)
            db.flush()

        if category_id is not None:
            category = db.get(Category, category_id)
            if category is None:
                raise Exception("Danh mục không tồn tại")

        product = Product(
            store_id=store.id,
            category_id=category_id,
            name=name.strip(),
            description=description.strip(),
            price=price,
            stock_quantity=stock_quantity,
            image_urls=image_urls,
            main_file_url=main_file_url,
            license_type=license_type or "personal",
            user_tags=user_tags or [],
            ai_tags=[],
            software_tags=software_tags or [],
            format_tags=format_tags or [],
        )
        db.add(product)
        db.commit()
        db.refresh(product)

        # Trigger AI tagging in background (fire-and-forget)
        if image_urls:
            from app.core.config import settings
            tmdt_base = os.getenv("TMDT_INTERNAL_URL", "http://localhost:8000")
            product_id = str(product.id)
            first_image = image_urls[0]
            callback_url = f"{tmdt_base}/api/v1/internal/products/{product_id}/ai-tags"
            asyncio.create_task(_trigger_ai_tagging(product_id, first_image, callback_url))

        return to_product_type(product)

    @strawberry.mutation
    def updateProfile(
        self,
        info: Info,
        full_name: Optional[str] = None,
        bio: Optional[str] = None,
        avatar_url: Optional[str] = None,
        banner_url: Optional[str] = None,
        specialties: Optional[list[str]] = None,
        website: Optional[str] = None,
        twitter: Optional[str] = None,
        instagram: Optional[str] = None,
    ) -> UserType:
        user = info.context.get("current_user")
        if user is None:
            raise Exception("Bạn chưa đăng nhập")

        db = _db(info)
        if full_name is not None:
            user.full_name = full_name.strip()
        if bio is not None:
            user.bio = bio
        if avatar_url is not None:
            user.avatar_url = avatar_url
        if banner_url is not None:
            user.banner_url = banner_url if banner_url != "" else None
        if specialties is not None:
            user.specialties = specialties

        social = dict(user.social_links or {})
        if website is not None:
            social["website"] = website
        if twitter is not None:
            social["twitter"] = twitter
        if instagram is not None:
            social["instagram"] = instagram
        user.social_links = social

        db.add(user)
        db.commit()
        db.refresh(user)
        return to_user_type(user)

    @strawberry.mutation
    def updateShortlink(self, info: Info, shortlink: str) -> UserType:
        user = info.context.get("current_user")
        if user is None:
            raise Exception("Bạn chưa đăng nhập")

        if not user.is_gold:
            raise Exception("Chỉ tài khoản Gold mới có thể đổi shortlink")

        sl = shortlink.strip().lower()
        if not sl:
            raise Exception("Shortlink không được để trống")
        if len(sl) > 32:
            raise Exception("Shortlink tối đa 32 ký tự")
        if not sl.replace('-', '').replace('_', '').isalnum():
            raise Exception("Shortlink chỉ được chứa chữ cái, số, dấu - hoặc _")

        db = _db(info)
        existing = db.scalar(select(User).where(User.shortlink == sl))
        if existing and existing.id != user.id:
            raise Exception("Shortlink này đã được sử dụng")

        user.shortlink = sl
        db.add(user)
        db.commit()
        db.refresh(user)
        return to_user_type(user)

    @strawberry.mutation
    def resolveReport(self, info: Info, reportId: UUID) -> ReportType:
        user = info.context.get("current_user")
        if user is None or user.role != RoleEnum.ADMIN:
            raise Exception("Không có quyền thực hiện thao tác này")
        
        db = _db(info)
        report = db.get(Report, reportId)
        if report is None:
            raise Exception("Không tìm thấy báo cáo")
            
        report.status = ReportStatusEnum.RESOLVED
        db.add(report)
        db.commit()
        db.refresh(report)
        return to_report_type(report)


async def _trigger_ai_tagging(product_id: str, image_url: str, callback_url: str) -> None:
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            await client.post(
                f"{CACAO_BASE_URL}/api/v1/tag-image",
                json={"product_id": product_id, "image_url": image_url, "callback_url": callback_url},
            )
    except Exception as e:
        print(f"[AI tagging] trigger failed for {product_id}: {e}")

