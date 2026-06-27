from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Order, Payment


def create_payment(db: Session, **data) -> Payment:
    payment = Payment(**data)
    db.add(payment)
    db.flush()
    return payment


def get_payment_by_order_id(db: Session, order_id) -> Payment | None:
    return db.scalar(select(Payment).where(Payment.order_id == order_id))


def get_payment_by_transaction_id(db: Session, transaction_id: str) -> Payment | None:
    return db.scalar(select(Payment).where(Payment.transaction_id == transaction_id))
