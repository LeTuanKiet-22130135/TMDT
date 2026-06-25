from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, JSON, Numeric, String, Text, UniqueConstraint, func, text
from sqlalchemy.dialects.postgresql import ENUM as PGEnum
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class RoleEnum(str, Enum):
    ADMIN = "ADMIN"
    SELLER = "SELLER"
    BUYER = "BUYER"


class AuthProviderEnum(str, Enum):
    LOCAL = "LOCAL"
    GOOGLE = "GOOGLE"
    FACEBOOK = "FACEBOOK"


class OrderStatusEnum(str, Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    PROCESSING = "PROCESSING"
    SHIPPED = "SHIPPED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class PaymentMethodEnum(str, Enum):
    COD = "COD"
    CREDIT_CARD = "CREDIT_CARD"
    PAYPAL = "PAYPAL"


class PaymentStatusEnum(str, Enum):
    UNPAID = "UNPAID"
    PAID = "PAID"
    REFUNDED = "REFUNDED"
    FAILED = "FAILED"


class ReportTypeEnum(str, Enum):
    STORE_VIOLATION = "STORE_VIOLATION"
    CUSTOMER_VIOLATION = "CUSTOMER_VIOLATION"
    PRODUCT_VIOLATION = "PRODUCT_VIOLATION"


class ReportStatusEnum(str, Enum):
    PENDING = "PENDING"
    REVIEWED = "REVIEWED"
    RESOLVED = "RESOLVED"
    DISMISSED = "DISMISSED"


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class CreatedAtMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


def pg_enum(enum_class: type[Enum], name: str) -> PGEnum:
    return PGEnum(enum_class, name=name, create_type=True)


class User(Base, TimestampMixin):
    __tablename__ = "users"
    __table_args__ = (
        Index("ix_users_email", "email"),
        Index("ix_users_shortlink", "shortlink", unique=True),
    )

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    auth_provider: Mapped[AuthProviderEnum] = mapped_column(pg_enum(AuthProviderEnum, "auth_provider_enum"), nullable=False, default=AuthProviderEnum.LOCAL)
    provider_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    role: Mapped[RoleEnum] = mapped_column(pg_enum(RoleEnum, "role_enum"), nullable=False, default=RoleEnum.BUYER)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    banner_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    specialties: Mapped[list] = mapped_column(JSONB().with_variant(JSON(), "sqlite"), nullable=False, default=list, server_default=text("'[]'::jsonb"))
    social_links: Mapped[dict] = mapped_column(JSONB().with_variant(JSON(), "sqlite"), nullable=False, default=dict, server_default=text("'{}'::jsonb"))
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reward_points: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default=text("0"))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=text("true"))
    is_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=text("false"))
    is_gold: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=text("false"))
    shortlink: Mapped[Optional[str]] = mapped_column(String(32), unique=True, nullable=True)
    verification_otp: Mapped[Optional[str]] = mapped_column(String(6), nullable=True)
    verification_otp_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    store: Mapped[Optional["Store"]] = relationship(back_populates="owner", uselist=False)
    cart: Mapped[Optional["ShoppingCart"]] = relationship(back_populates="user", uselist=False)
    orders: Mapped[list["Order"]] = relationship(back_populates="user")
    reviews: Mapped[list["Review"]] = relationship(back_populates="user")
    comments: Mapped[list["Comment"]] = relationship(back_populates="user")
    reports_made: Mapped[list["Report"]] = relationship(back_populates="reporter", foreign_keys="Report.reporter_id")
    reports_against_user: Mapped[list["Report"]] = relationship(back_populates="reported_user", foreign_keys="Report.reported_user_id")


class Store(Base, TimestampMixin):
    __tablename__ = "stores"
    __table_args__ = (Index("ix_stores_name", "name"),)

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    owner_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    rating: Mapped[Decimal] = mapped_column(Numeric(3, 2), nullable=False, default=Decimal("0.00"), server_default=text("0.00"))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=text("true"))

    owner: Mapped[User] = relationship(back_populates="store")
    products: Mapped[list["Product"]] = relationship(back_populates="store")
    orders: Mapped[list["Order"]] = relationship(back_populates="store")
    reports: Mapped[list["Report"]] = relationship(back_populates="reported_store")


class Category(Base):
    __tablename__ = "categories"
    __table_args__ = (Index("ix_categories_name", "name"),)

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    parent_id: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    parent: Mapped[Optional["Category"]] = relationship(remote_side="Category.id", back_populates="children")
    children: Mapped[list["Category"]] = relationship(back_populates="parent")
    products: Mapped[list["Product"]] = relationship(back_populates="category")


class Product(Base, TimestampMixin):
    __tablename__ = "products"
    __table_args__ = (
        Index("ix_products_store_id", "store_id"),
        Index("ix_products_category_id", "category_id"),
        Index("ix_products_name", "name"),
        Index("ix_products_created_at", "created_at"),
    )

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    store_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("stores.id", ondelete="CASCADE"), nullable=False)
    category_id: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    stock_quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default=text("0"))
    sold_quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default=text("0"))
    view_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default=text("0"))
    brand: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    image_urls: Mapped[list[str]] = mapped_column(JSONB().with_variant(JSON(), "sqlite"), nullable=False, default=list)
    main_file_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    license_type: Mapped[str] = mapped_column(String(50), nullable=False, default="personal", server_default=text("'personal'"))
    user_tags: Mapped[list] = mapped_column(JSONB().with_variant(JSON(), "sqlite"), nullable=False, default=list, server_default=text("'[]'::jsonb"))
    ai_tags: Mapped[list] = mapped_column(JSONB().with_variant(JSON(), "sqlite"), nullable=False, default=list, server_default=text("'[]'::jsonb"))
    software_tags: Mapped[list] = mapped_column(JSONB().with_variant(JSON(), "sqlite"), nullable=False, default=list, server_default=text("'[]'::jsonb"))
    format_tags: Mapped[list] = mapped_column(JSONB().with_variant(JSON(), "sqlite"), nullable=False, default=list, server_default=text("'[]'::jsonb"))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=text("true"))

    store: Mapped[Store] = relationship(back_populates="products")
    category: Mapped[Category] = relationship(back_populates="products")
    cart_items: Mapped[list["CartItem"]] = relationship(back_populates="product")
    order_items: Mapped[list["OrderItem"]] = relationship(back_populates="product")
    reviews: Mapped[list["Review"]] = relationship(back_populates="product")
    comments: Mapped[list["Comment"]] = relationship(back_populates="product")


class ShoppingCart(Base):
    __tablename__ = "shopping_cart"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    user: Mapped[User] = relationship(back_populates="cart")
    items: Mapped[list["CartItem"]] = relationship(back_populates="cart", cascade="all, delete-orphan")


class CartItem(Base):
    __tablename__ = "cart_items"
    __table_args__ = (UniqueConstraint("cart_id", "product_id", name="uq_cart_items_cart_product"),)

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    cart_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("shopping_cart.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1, server_default=text("1"))

    cart: Mapped[ShoppingCart] = relationship(back_populates="items")
    product: Mapped[Product] = relationship(back_populates="cart_items")


class Order(Base, TimestampMixin):
    __tablename__ = "orders"
    __table_args__ = (
        Index("ix_orders_user_id", "user_id"),
        Index("ix_orders_store_id", "store_id"),
        Index("ix_orders_status", "status"),
    )

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    store_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("stores.id", ondelete="RESTRICT"), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    points_used: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default=text("0"))
    discount_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=Decimal("0.00"), server_default=text("0.00"))
    final_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[OrderStatusEnum] = mapped_column(pg_enum(OrderStatusEnum, "order_status_enum"), nullable=False, default=OrderStatusEnum.PENDING)
    shipping_address: Mapped[str] = mapped_column(Text, nullable=False)

    user: Mapped[User] = relationship(back_populates="orders")
    store: Mapped[Store] = relationship(back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(back_populates="order", cascade="all, delete-orphan")
    payments: Mapped[list["Payment"]] = relationship(back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    order_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)

    order: Mapped[Order] = relationship(back_populates="items")
    product: Mapped[Product] = relationship(back_populates="order_items")
    review: Mapped[Optional["Review"]] = relationship(back_populates="order_item", uselist=False)


class Payment(Base, CreatedAtMixin):
    __tablename__ = "payments"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    order_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    method: Mapped[PaymentMethodEnum] = mapped_column(pg_enum(PaymentMethodEnum, "payment_method_enum"), nullable=False)
    status: Mapped[PaymentStatusEnum] = mapped_column(pg_enum(PaymentStatusEnum, "payment_status_enum"), nullable=False, default=PaymentStatusEnum.UNPAID)
    transaction_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    order: Mapped[Order] = relationship(back_populates="payments")


class Review(Base, CreatedAtMixin):
    __tablename__ = "reviews"
    __table_args__ = (UniqueConstraint("order_item_id", name="uq_reviews_order_item_id"),)

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    order_item_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("order_items.id", ondelete="CASCADE"), unique=True, nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[str] = mapped_column(Text, nullable=False)

    user: Mapped[User] = relationship(back_populates="reviews")
    product: Mapped[Product] = relationship(back_populates="reviews")
    order_item: Mapped[OrderItem] = relationship(back_populates="review")


class Comment(Base, TimestampMixin):
    __tablename__ = "comments"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    parent_id: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True), ForeignKey("comments.id", ondelete="CASCADE"), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)

    user: Mapped[User] = relationship(back_populates="comments")
    product: Mapped[Product] = relationship(back_populates="comments")
    parent: Mapped[Optional["Comment"]] = relationship(remote_side="Comment.id", back_populates="replies")
    replies: Mapped[list["Comment"]] = relationship(back_populates="parent", cascade="all, delete-orphan")


class Report(Base, CreatedAtMixin):
    __tablename__ = "reports"
    __table_args__ = (Index("ix_reports_status", "status"),)

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    reporter_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reported_store_id: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True), ForeignKey("stores.id", ondelete="SET NULL"), nullable=True)
    reported_user_id: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    report_type: Mapped[ReportTypeEnum] = mapped_column(pg_enum(ReportTypeEnum, "report_type_enum"), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[ReportStatusEnum] = mapped_column(pg_enum(ReportStatusEnum, "report_status_enum"), nullable=False, default=ReportStatusEnum.PENDING)

    reporter: Mapped[User] = relationship(back_populates="reports_made", foreign_keys=[reporter_id])
    reported_store: Mapped[Optional[Store]] = relationship(back_populates="reports", foreign_keys=[reported_store_id])
    reported_user: Mapped[Optional[User]] = relationship(back_populates="reports_against_user", foreign_keys=[reported_user_id])
