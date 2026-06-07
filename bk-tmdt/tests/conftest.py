from pathlib import Path
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import SessionLocal
from app.main import app
from app.models import AuthProviderEnum, Category, Order, OrderItem, OrderStatusEnum, Payment, PaymentMethodEnum, PaymentStatusEnum, Product, Report, ReportStatusEnum, ReportTypeEnum, Review, RoleEnum, ShoppingCart, Store, User
from app.api.dependencies import get_current_admin, get_current_seller, get_current_user, get_current_user_optional, get_db


TEST_ENGINE = create_engine(
    "sqlite+pysqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=TEST_ENGINE)


@pytest.fixture(autouse=True)
def db_session() -> Generator:
    Base.metadata.drop_all(bind=TEST_ENGINE)
    Base.metadata.create_all(bind=TEST_ENGINE)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture()
def sample_data(db_session):
    buyer = User(email="buyer@example.com", password_hash="hash", auth_provider=AuthProviderEnum.LOCAL, role=RoleEnum.BUYER, full_name="Buyer User", is_verified=True, reward_points=10)
    seller = User(email="seller@example.com", password_hash="hash", auth_provider=AuthProviderEnum.LOCAL, role=RoleEnum.SELLER, full_name="Seller User", is_verified=True)
    admin = User(email="admin@example.com", password_hash="hash", auth_provider=AuthProviderEnum.LOCAL, role=RoleEnum.ADMIN, full_name="Admin User", is_verified=True)
    db_session.add_all([buyer, seller, admin])
    db_session.flush()

    store = Store(owner_id=seller.id, name="Creator Portfolio", description="Digital assets", is_active=True)
    category = Category(name="VTuber Avatars", description="Avatar assets")
    db_session.add_all([store, category])
    db_session.flush()

    product = Product(store_id=store.id, category_id=category.id, name="Live2D Rig", description="Rigging service", price=1000, stock_quantity=5, sold_quantity=0, view_count=0, brand="Studio", image_urls=["https://example.com/1.png"], is_active=True)
    db_session.add(product)
    db_session.flush()

    cart = ShoppingCart(user_id=buyer.id)
    db_session.add(cart)
    db_session.flush()

    db_session.commit()
    return {"buyer": buyer, "seller": seller, "admin": admin, "store": store, "category": category, "product": product, "cart": cart}


@pytest.fixture()
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()
