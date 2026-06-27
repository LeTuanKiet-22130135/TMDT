from datetime import datetime, timedelta, timezone
from decimal import Decimal
from random import randint
from uuid import uuid4

from sqlalchemy import select

from app.core.security import hash_password
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models import (
    AuthProviderEnum,
    Category,
    Comment,
    Order,
    OrderItem,
    OrderStatusEnum,
    Payment,
    PaymentMethodEnum,
    PaymentStatusEnum,
    Product,
    Report,
    ReportStatusEnum,
    ReportTypeEnum,
    Review,
    RoleEnum,
    ShoppingCart,
    Store,
    User,
)


CATEGORY_NAMES = [
    "VTuber Avatars",
    "Twitch Emotes",
    "Concept Art",
    "Live2D Rigging",
    "Commercial Illustrations",
]


def main() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.scalar(select(User).limit(1)) is not None:
            return

        admin = User(
            email="admin@tmdt.local",
            password_hash=hash_password("Admin1234!"),
            auth_provider=AuthProviderEnum.LOCAL,
            role=RoleEnum.ADMIN,
            full_name="Platform Admin",
            is_verified=True,
        )
        buyer = User(
            email="client@tmdt.local",
            password_hash=hash_password("Client1234!"),
            auth_provider=AuthProviderEnum.LOCAL,
            role=RoleEnum.BUYER,
            full_name="Alicia Client",
            is_verified=True,
            reward_points=12,
        )
        seller = User(
            email="artist@tmdt.local",
            password_hash=hash_password("Artist1234!"),
            auth_provider=AuthProviderEnum.LOCAL,
            role=RoleEnum.SELLER,
            full_name="Mina Artist",
            is_verified=True,
        )
        db.add_all([admin, buyer, seller])
        db.flush()

        store = Store(owner_id=seller.id, name="Mina's Art Station", description="Custom digital assets and licensing for creators.")
        db.add(store)
        db.flush()

        categories = []
        for name in CATEGORY_NAMES:
            category = Category(name=name, description=f"{name} services and assets")
            categories.append(category)
            db.add(category)
        db.flush()

        products = []
        for idx, name in enumerate([
            "Premium VTuber Live2D Rigging",
            "Twitch Emote Pack",
            "Fantasy Character Concept Art",
            "Chibi Avatar Design",
            "Commercial Illustration License",
        ]):
            product = Product(
                store_id=store.id,
                category_id=categories[idx % len(categories)].id,
                name=name,
                description=f"{name} for creators and studios.",
                price=Decimal(str(randint(500000, 3000000))),
                stock_quantity=randint(5, 20),
                sold_quantity=randint(0, 40),
                view_count=randint(10, 500),
                brand="Studio",
                image_urls=[f"https://example.com/{idx + 1}.png"],
            )
            products.append(product)
            db.add(product)
        db.flush()

        cart = ShoppingCart(user_id=buyer.id)
        db.add(cart)
        db.flush()

        order = Order(
            user_id=buyer.id,
            store_id=store.id,
            total_amount=Decimal("1800000.00"),
            points_used=2,
            discount_amount=Decimal("2000.00"),
            final_amount=Decimal("1798000.00"),
            status=OrderStatusEnum.COMPLETED,
            shipping_address="Digital delivery to client inbox",
            created_at=datetime.now(timezone.utc) - timedelta(days=10),
        )
        db.add(order)
        db.flush()

        item = OrderItem(order_id=order.id, product_id=products[0].id, unit_price=products[0].price, quantity=1)
        db.add(item)
        db.flush()

        payment = Payment(order_id=order.id, method=PaymentMethodEnum.CREDIT_CARD, status=PaymentStatusEnum.PAID, transaction_id=str(uuid4()))
        db.add(payment)

        db.add_all([
            Review(user_id=buyer.id, product_id=products[0].id, order_item_id=item.id, rating=5, comment="Excellent rigging quality and fast turnaround."),
            Comment(user_id=buyer.id, product_id=products[1].id, parent_id=None, content="Do you offer custom emote sizes?"),
            Report(reporter_id=buyer.id, reported_store_id=store.id, reported_user_id=None, report_type=ReportTypeEnum.STORE_VIOLATION, reason="Sample moderation report for testing.", status=ReportStatusEnum.PENDING),
        ])

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    main()
