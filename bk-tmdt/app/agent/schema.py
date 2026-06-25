"""
Agent GraphQL Schema

Endpoint riêng tại /agent/graphql — độc lập với /graphql chính.

Mutations:
  - agentLogin(email, password) → AgentTokenType
  - agentCreateProduct(...) → AgentProductType
  - agentUpdateProduct(productId, ...) → AgentProductType   [admin-level: any product]

Queries:
  - agentMe → AgentUserType | None
  - agentPing → str
"""
import asyncio
import os
from decimal import Decimal
from typing import Optional
from uuid import UUID

import strawberry
from sqlalchemy import select
from sqlalchemy.orm import Session
from strawberry.fastapi import GraphQLRouter
from strawberry.types import Info

from app.agent.context import get_agent_context
from app.agent.types import AgentProductType, AgentTokenType, AgentUserType
from app.core.security import create_access_token, verify_password, hash_password
from app.models import Category, Product, ShoppingCart, Store, User
from app.models.entities import RoleEnum

CACAO_BASE_URL = os.getenv("CACAO_URL", "http://localhost:8001")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _db(info: Info) -> Session:
    return info.context["db"]


def _current_user(info: Info) -> User | None:
    return info.context.get("current_user")


def _require_user(info: Info) -> User:
    user = _current_user(info)
    if user is None:
        raise Exception("Cần đăng nhập: truyền Authorization: Bearer <token>")
    return user


def _to_agent_user(user: User) -> AgentUserType:
    return AgentUserType(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role.value,
        is_verified=user.is_verified,
        is_active=user.is_active,
    )


def _to_agent_product(product: Product) -> AgentProductType:
    return AgentProductType(
        id=str(product.id),
        store_id=str(product.store_id),
        name=product.name,
        description=product.description,
        price=float(product.price),
        stock_quantity=product.stock_quantity,
        image_urls=list(product.image_urls or []),
        main_file_url=product.main_file_url,
        license_type=product.license_type or "personal",
        user_tags=list(product.user_tags or []),
        software_tags=list(product.software_tags or []),
        format_tags=list(product.format_tags or []),
        is_active=product.is_active,
        category_id=str(product.category_id) if product.category_id else None,
        created_at=product.created_at,
        updated_at=product.updated_at,
    )


# ---------------------------------------------------------------------------
# Query
# ---------------------------------------------------------------------------

@strawberry.type
class AgentQuery:
    @strawberry.field(description="Health check — trả về 'pong'")
    def agent_ping(self) -> str:
        return "pong"

    @strawberry.field(description="Trả về thông tin user đang đăng nhập (dùng Bearer token)")
    def agent_me(self, info: Info) -> AgentUserType | None:
        user = _current_user(info)
        if user is None:
            return None
        return _to_agent_user(user)

    @strawberry.field(description="Lấy thông tin sản phẩm theo ID")
    def agent_product(self, info: Info, product_id: UUID) -> AgentProductType | None:
        product = _db(info).get(Product, product_id)
        if product is None:
            return None
        return _to_agent_product(product)


# ---------------------------------------------------------------------------
# Mutation
# ---------------------------------------------------------------------------

@strawberry.type
class AgentMutation:
    @strawberry.mutation(
        description="Đăng ký user mới (bỏ qua OTP, quyền agent). Trả về token."
    )
    def agent_register(
        self, info: Info, email: str, password: str, full_name: str, role: str = "BUYER"
    ) -> AgentTokenType:
        db = _db(info)
        existing = db.scalar(select(User).where(User.email == email))
        if existing:
            raise Exception("Email đã tồn tại")

        user_role = RoleEnum(role)
        user = User(
            email=email,
            password_hash=hash_password(password),
            full_name=full_name,
            role=user_role,
            is_verified=True,  # bypass OTP
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        access_token = create_access_token(str(user.id))
        return AgentTokenType(
            access_token=access_token,
            token_type="bearer",
            user=_to_agent_user(user),
        )

    @strawberry.mutation(
        description=(
            "Đăng nhập bằng email/password, trả về access token dùng cho các "
            "mutation tiếp theo qua header Authorization: Bearer <token>"
        )
    )
    def agent_login(self, info: Info, email: str, password: str) -> AgentTokenType:
        db = _db(info)
        user = db.scalar(select(User).where(User.email == email))
        if user is None or user.password_hash is None or not verify_password(password, user.password_hash):
            raise Exception("Email hoặc mật khẩu không đúng")
        if not user.is_active:
            raise Exception("Tài khoản đã bị vô hiệu hóa")

        access_token = create_access_token(str(user.id))
        return AgentTokenType(
            access_token=access_token,
            token_type="bearer",
            user=_to_agent_user(user),
        )

    @strawberry.mutation(
        description="Tạo sản phẩm mới. Yêu cầu Authorization: Bearer token của seller."
    )
    def agent_create_product(
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
    ) -> AgentProductType:
        user = _require_user(info)
        db = _db(info)

        # Tìm hoặc tạo store cho user
        store = db.scalar(select(Store).where(Store.owner_id == user.id))
        if store is None:
            store_name = f"{user.full_name.strip()} ({user.email.split('@')[0]})"
            store = Store(owner_id=user.id, name=store_name)
            db.add(store)
            db.flush()

        # Validate category nếu có
        if category_id is not None:
            category = db.get(Category, category_id)
            if category is None:
                raise Exception(f"Danh mục không tồn tại: {category_id}")

        product = Product(
            store_id=store.id,
            category_id=category_id,
            name=name.strip(),
            description=description.strip(),
            price=Decimal(str(price)),
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

        # Trigger AI tagging (fire-and-forget)
        if image_urls:
            tmdt_base = os.getenv("TMDT_INTERNAL_URL", "http://localhost:8000")
            product_id_str = str(product.id)
            callback_url = f"{tmdt_base}/api/v1/internal/products/{product_id_str}/ai-tags"
            asyncio.create_task(
                _trigger_ai_tagging(product_id_str, image_urls[0], callback_url)
            )

        return _to_agent_product(product)

    @strawberry.mutation(
        description=(
            "Cập nhật sản phẩm (quyền admin-level: có thể cập nhật sản phẩm của bất kỳ seller nào). "
            "Yêu cầu Authorization: Bearer token."
        )
    )
    def agent_update_product(
        self,
        info: Info,
        product_id: UUID,
        name: Optional[str] = None,
        description: Optional[str] = None,
        price: Optional[float] = None,
        image_urls: Optional[list[str]] = None,
        main_file_url: Optional[str] = None,
        user_tags: Optional[list[str]] = None,
        software_tags: Optional[list[str]] = None,
        format_tags: Optional[list[str]] = None,
        license_type: Optional[str] = None,
        stock_quantity: Optional[int] = None,
        category_id: Optional[UUID] = None,
        is_active: Optional[bool] = None,
    ) -> AgentProductType:
        # Cần đăng nhập (agent key đã được validate ở context)
        _require_user(info)
        db = _db(info)

        product = db.get(Product, product_id)
        if product is None:
            raise Exception(f"Không tìm thấy sản phẩm: {product_id}")

        # Validate category nếu thay đổi
        if category_id is not None:
            category = db.get(Category, category_id)
            if category is None:
                raise Exception(f"Danh mục không tồn tại: {category_id}")
            product.category_id = category_id

        # Apply patches (chỉ field nào được truyền)
        if name is not None:
            product.name = name.strip()
        if description is not None:
            product.description = description.strip()
        if price is not None:
            product.price = Decimal(str(price))
        if image_urls is not None:
            product.image_urls = image_urls
        if main_file_url is not None:
            product.main_file_url = main_file_url
        if user_tags is not None:
            product.user_tags = user_tags
        if software_tags is not None:
            product.software_tags = software_tags
        if format_tags is not None:
            product.format_tags = format_tags
        if license_type is not None:
            product.license_type = license_type
        if stock_quantity is not None:
            product.stock_quantity = stock_quantity
        if is_active is not None:
            product.is_active = is_active

        db.add(product)
        db.commit()
        db.refresh(product)
        return _to_agent_product(product)


# ---------------------------------------------------------------------------
# Schema & Router
# ---------------------------------------------------------------------------

schema = strawberry.Schema(query=AgentQuery, mutation=AgentMutation)
agent_graphql_router = GraphQLRouter(schema, context_getter=get_agent_context)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

async def _trigger_ai_tagging(product_id: str, image_url: str, callback_url: str) -> None:
    import httpx
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            await client.post(
                f"{CACAO_BASE_URL}/api/v1/tag-image",
                json={
                    "product_id": product_id,
                    "image_url": image_url,
                    "callback_url": callback_url,
                },
            )
    except Exception as e:
        print(f"[Agent AI tagging] trigger failed for {product_id}: {e}")
