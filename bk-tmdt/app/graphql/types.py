from datetime import datetime
from decimal import Decimal

import strawberry

from app.models import Product, Store, User


@strawberry.type
class UserType:
    id: str
    email: str
    full_name: str
    role: str
    is_verified: bool
    reward_points: int


@strawberry.type
class StoreType:
    id: str
    owner_id: str
    name: str
    description: str | None
    rating: float
    is_active: bool
    updated_at: datetime
    created_at: datetime


@strawberry.type
class ProductType:
    id: str
    store_id: str
    category_id: str
    name: str
    description: str
    price: float
    stock_quantity: int
    sold_quantity: int
    view_count: int
    brand: str | None
    image_urls: list[str]
    is_active: bool
    updated_at: datetime
    created_at: datetime


@strawberry.type
class ProductConnection:
    items: list[ProductType]
    total_items: int
    total_pages: int


@strawberry.type
class StoreConnection:
    items: list[StoreType]
    total_items: int
    total_pages: int


def to_user_type(user: User) -> UserType:
    return UserType(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role.value,
        is_verified=user.is_verified,
        reward_points=user.reward_points,
    )


def to_store_type(store: Store) -> StoreType:
    return StoreType(
        id=str(store.id),
        owner_id=str(store.owner_id),
        name=store.name,
        description=store.description,
        rating=_as_float(store.rating),
        is_active=store.is_active,
        updated_at=store.updated_at,
        created_at=store.created_at,
    )


def to_product_type(product: Product) -> ProductType:
    return ProductType(
        id=str(product.id),
        store_id=str(product.store_id),
        category_id=str(product.category_id),
        name=product.name,
        description=product.description,
        price=_as_float(product.price),
        stock_quantity=product.stock_quantity,
        sold_quantity=product.sold_quantity,
        view_count=product.view_count,
        brand=product.brand,
        image_urls=list(product.image_urls),
        is_active=product.is_active,
        updated_at=product.updated_at,
        created_at=product.created_at,
    )


def _as_float(value: Decimal | float | int) -> float:
    return float(value)