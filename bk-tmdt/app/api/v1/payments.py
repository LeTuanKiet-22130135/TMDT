from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_db
from app.core.config import settings
from app.crud.orders import get_order
from app.crud.payments import create_payment, get_payment_by_order_id, get_payment_by_transaction_id
from app.models import Order, OrderStatusEnum, PaymentMethodEnum, PaymentStatusEnum, User
from app.schemas.payment import PaymentInitiateRequest, PaymentRead, PaymentWebhookRequest, PaymentWebhookResponse


router = APIRouter()


def _serialize_payment(payment) -> PaymentRead:
    return PaymentRead.model_validate(payment)


@router.get("/{order_id}", response_model=PaymentRead)
def get_order_payment(order_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> PaymentRead:
    order = get_order(db, order_id)
    if order is None or order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    payment = get_payment_by_order_id(db, order_id)
    if payment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    return _serialize_payment(payment)


@router.post("/{order_id}/initiate", response_model=PaymentRead, status_code=status.HTTP_201_CREATED)
def initiate_payment(
    order_id: UUID,
    payload: PaymentInitiateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PaymentRead:
    order = get_order(db, order_id)
    if order is None or order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    payment = get_payment_by_order_id(db, order_id)
    if payment is None:
        transaction_id = str(uuid4()) if payload.method != PaymentMethodEnum.COD else None
        payment = create_payment(
            db,
            order_id=order.id,
            method=payload.method,
            status=PaymentStatusEnum.UNPAID,
            transaction_id=transaction_id,
        )
        db.commit()
        db.refresh(payment)
    return _serialize_payment(payment)


@router.post("/webhook", response_model=PaymentWebhookResponse)
def payment_webhook(
    payload: PaymentWebhookRequest,
    db: Session = Depends(get_db),
    x_webhook_secret: str | None = Header(default=None, alias="X-Webhook-Secret"),
) -> PaymentWebhookResponse:
    if settings.webhook_secret and x_webhook_secret != settings.webhook_secret:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid webhook secret")

    payment = get_payment_by_transaction_id(db, payload.transaction_id)
    if payment is None and payload.order_id is not None:
        payment = get_payment_by_order_id(db, payload.order_id)
    if payment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")

    payment.status = payload.payment_status
    db.add(payment)

    order = db.get(Order, payment.order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if payload.payment_status == PaymentStatusEnum.PAID:
        order.status = OrderStatusEnum.PAID
    elif payload.payment_status == PaymentStatusEnum.FAILED:
        order.status = OrderStatusEnum.PENDING
    db.add(order)
    db.commit()
    db.refresh(payment)
    db.refresh(order)
    return PaymentWebhookResponse(payment=_serialize_payment(payment), order_status=order.status.value)
