from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Order, OrderItem, OrderStatusEnum, Product, Review, Store


def user_can_review_product(db: Session, user_id, product_id, order_item_id) -> bool:
    statement = (
        select(OrderItem)
        .join(Order, OrderItem.order_id == Order.id)
        .where(
            Order.user_id == user_id,
            Order.status == OrderStatusEnum.COMPLETED,
            OrderItem.id == order_item_id,
            OrderItem.product_id == product_id,
        )
    )
    return db.scalar(statement) is not None


def create_review(db: Session, **data) -> Review:
    review = Review(**data)
    db.add(review)
    db.flush()
    return review


def get_store_average_rating(db: Session, store_id) -> Decimal:
    statement = (
        select(func.coalesce(func.avg(Review.rating), 0))
        .select_from(Review)
        .join(Product, Review.product_id == Product.id)
        .where(Product.store_id == store_id)
    )
    return Decimal(str(db.scalar(statement) or 0))


def recalc_store_rating(db: Session, store_id) -> None:
    store = db.get(Store, store_id)
    if store is None:
        return
    store.rating = get_store_average_rating(db, store_id)
    db.add(store)
