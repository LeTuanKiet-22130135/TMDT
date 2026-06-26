from datetime import datetime
from decimal import Decimal

import strawberry

from app.models import Category, Product, Store, User, Order, Report


@strawberry.type
class UserType:
    id: str
    email: str
    username: str
    shortlink: str
    is_gold: bool
    full_name: str
    avatar_url: str | None
    banner_url: str | None
    bio: str | None
    specialties: list[str]
    social_links: strawberry.scalars.JSON
    role: str
    is_verified: bool
    reward_points: int
    is_active: bool
    created_at: datetime


@strawberry.type
class AuthorType:
    id: str
    shortlink: str
    is_gold: bool
    full_name: str
    avatar_url: str | None
    banner_url: str | None
    bio: str | None
    specialties: list[str]
    social_links: strawberry.scalars.JSON
    is_verified: bool
    created_at: datetime


@strawberry.type
class FollowedAuthorType:
    id: str
    shortlink: str
    full_name: str
    avatar_url: str | None
    is_verified: bool
    is_gold: bool
    product_count: int


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
    owner: UserType


@strawberry.type
class CategoryType:
    id: str
    name: str
    description: str | None


@strawberry.type
class ProductType:
    id: str
    store_id: str
    category_id: str
    name: str
    description: str
    price: float
    stock_quantity: int
    stock: int
    sold_quantity: int
    view_count: int
    brand: str | None
    image_urls: list[str]
    main_file_url: str | None
    license_type: str
    user_tags: list[str]
    ai_tags: list[str]
    software_tags: list[str]
    format_tags: list[str]
    is_active: bool
    updated_at: datetime
    created_at: datetime
    store: StoreType



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


@strawberry.type
class UserConnection:
    items: list[UserType]
    total_items: int
    total_pages: int


@strawberry.type
class OrderType:
    id: str
    status: str
    total_amount: float
    created_at: datetime
    buyer: UserType


@strawberry.type
class OrderConnection:
    items: list[OrderType]
    total_items: int
    total_pages: int


@strawberry.type
class ReportType:
    id: str
    reporter_id: str
    reported_store_id: str | None
    reported_user_id: str | None
    report_type: str
    reason: str
    status: str
    created_at: datetime
    reporter: UserType
    reported_store: StoreType | None
    reported_user: UserType | None


@strawberry.type
class ReportConnection:
    items: list[ReportType]
    total_items: int
    total_pages: int


@strawberry.type
class AdminStatsType:
    total_users: int
    total_orders: int
    total_products: int
    total_stores: int
    total_revenue: float
    pending_orders: int


def to_user_type(user: User) -> UserType:
    return UserType(
        id=str(user.id),
        email=user.email,
        username=user.email.split('@')[0],
        shortlink=user.shortlink or '',
        is_gold=user.is_gold,
        full_name=user.full_name,
        avatar_url=user.avatar_url,
        banner_url=user.banner_url,
        bio=user.bio,
        specialties=list(user.specialties or []),
        social_links=dict(user.social_links or {}),
        role=user.role.value,
        is_verified=user.is_verified,
        reward_points=user.reward_points,
        is_active=user.is_active,
        created_at=user.created_at,
    )


def to_author_type(user: User) -> AuthorType:
    return AuthorType(
        id=str(user.id),
        shortlink=user.shortlink or '',
        is_gold=user.is_gold,
        full_name=user.full_name,
        avatar_url=user.avatar_url,
        banner_url=user.banner_url,
        bio=user.bio,
        specialties=list(user.specialties or []),
        social_links=dict(user.social_links or {}),
        is_verified=user.is_verified,
        created_at=user.created_at,
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
        owner=to_user_type(store.owner),
    )


def to_category_type(category: Category) -> CategoryType:
    return CategoryType(
        id=str(category.id),
        name=category.name,
        description=category.description,
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
        stock=product.stock_quantity,
        sold_quantity=product.sold_quantity,
        view_count=product.view_count,
        brand=product.brand,
        image_urls=list(product.image_urls),
        main_file_url=product.main_file_url,
        license_type=product.license_type or "personal",
        user_tags=list(product.user_tags or []),
        ai_tags=list(product.ai_tags or []),
        software_tags=list(product.software_tags or []),
        format_tags=list(product.format_tags or []),
        is_active=product.is_active,
        updated_at=product.updated_at,
        created_at=product.created_at,
        store=to_store_type(product.store),
    )



def to_order_type(order: Order) -> OrderType:
    return OrderType(
        id=str(order.id),
        status=order.status.value,
        total_amount=_as_float(order.total_amount),
        created_at=order.created_at,
        buyer=to_user_type(order.user),
    )


def to_report_type(report: Report) -> ReportType:
    return ReportType(
        id=str(report.id),
        reporter_id=str(report.reporter_id),
        reported_store_id=str(report.reported_store_id) if report.reported_store_id else None,
        reported_user_id=str(report.reported_user_id) if report.reported_user_id else None,
        report_type=report.report_type.value,
        reason=report.reason,
        status=report.status.value,
        created_at=report.created_at,
        reporter=to_user_type(report.reporter),
        reported_store=to_store_type(report.reported_store) if report.reported_store else None,
        reported_user=to_user_type(report.reported_user) if report.reported_user else None,
    )


def _as_float(value: Decimal | float | int) -> float:
    return float(value)