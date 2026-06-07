from collections import defaultdict
from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy import and_, select
from sqlalchemy.orm import Session, selectinload

from app.models import Order, OrderItem, OrderStatusEnum, Product, RoleEnum, User


def list_user_orders(db: Session, user_id) -> list[Order]:
    statement = (
        select(Order)
        .where(Order.user_id == user_id)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
        .order_by(Order.created_at.desc())
    )
    return list(db.scalars(statement).unique().all())


def get_order(db: Session, order_id) -> Order | None:
    statement = (
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
    )
    return db.scalars(statement).unique().one_or_none()


def get_order_by_id_for_store(db: Session, order_id, store_id) -> Order | None:
    statement = (
        select(Order)
        .where(and_(Order.id == order_id, Order.store_id == store_id))
        .options(selectinload(Order.items).selectinload(OrderItem.product))
    )
    return db.scalars(statement).unique().one_or_none()


def create_order(db: Session, **data) -> Order:
    order = Order(**data)
    db.add(order)
    db.flush()
    return order


def create_order_item(db: Session, **data) -> OrderItem:
    item = OrderItem(**data)
    db.add(item)
    db.flush()
    return item


def group_cart_items_by_store(cart_items: list[tuple[Product, int]]):
    grouped = defaultdict(list)
    for product, quantity in cart_items:
        grouped[product.store_id].append((product, quantity))
    return grouped


def to_decimal(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
