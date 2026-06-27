"""Digital-asset checkout — no cart sync needed.

Flow:
  1. POST /api/v1/checkout-digital  → create orders + payment records, return VNPay URL
  2. VNPay redirects browser to http://localhost:5173/checkout/result?vnp_...
  3. GET  /api/v1/checkout-digital/verify?vnp_... → verify hash, mark orders PAID
"""

from collections import defaultdict
from decimal import Decimal
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_db
from app.crud.orders import create_order, create_order_item
from app.crud.payments import create_payment
from app.models import (
    Order, OrderStatusEnum,
    Payment, PaymentMethodEnum, PaymentStatusEnum,
    Product, User,
)
from app.services.vnpay import create_payment_url, verify_return_params

router = APIRouter()


class DigitalCheckoutRequest(BaseModel):
    product_ids: list[str]
    tips: dict[str, int] = {}   # store_id (str UUID) → tip VND
    return_url: str


class DigitalCheckoutResponse(BaseModel):
    session_id: str
    order_ids: list[str]
    total: int
    payment_url: str


class VerifyResponse(BaseModel):
    success: bool
    message: str
    order_ids: list[str] = []
    amount: int = 0


@router.post("/", response_model=DigitalCheckoutResponse)
def checkout_digital(
    body: DigitalCheckoutRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DigitalCheckoutResponse:
    if not body.product_ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No products")

    uuids = [UUID(pid) for pid in body.product_ids]
    products = list(db.scalars(select(Product).where(Product.id.in_(uuids))).all())
    if len(products) != len(uuids):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or more products not found")

    # Group by store
    by_store: dict[UUID, list[Product]] = defaultdict(list)
    for p in products:
        by_store[p.store_id].append(p)

    session_id = str(uuid4())
    order_ids: list[str] = []
    total_vnd = 0

    for store_id, store_products in by_store.items():
        subtotal = sum(int(p.price) for p in store_products)
        tip = body.tips.get(str(store_id), 0)
        store_total = subtotal + tip

        order = create_order(
            db,
            user_id=current_user.id,
            store_id=store_id,
            total_amount=Decimal(str(subtotal)),
            points_used=0,
            discount_amount=Decimal("0"),
            final_amount=Decimal(str(store_total)),
            status=OrderStatusEnum.PENDING,
            shipping_address="Digital delivery",
        )
        db.flush()

        for p in store_products:
            create_order_item(
                db,
                order_id=order.id,
                product_id=p.id,
                unit_price=Decimal(str(p.price)),
                quantity=1,
            )

        create_payment(
            db,
            order_id=order.id,
            method=PaymentMethodEnum.VNPAY,
            status=PaymentStatusEnum.UNPAID,
            transaction_id=session_id,
        )

        order_ids.append(str(order.id))
        total_vnd += store_total

    # Free checkout — skip VNPay, mark everything PAID immediately
    if total_vnd == 0:
        payments_to_mark = list(
            db.scalars(select(Payment).where(Payment.transaction_id == session_id)).all()
        )
        for payment in payments_to_mark:
            payment.status = PaymentStatusEnum.PAID
            db.add(payment)
            order = db.get(Order, payment.order_id)
            if order:
                order.status = OrderStatusEnum.PAID
                db.add(order)
        db.commit()
        free_url = f"{body.return_url}?free=1&session_id={session_id}"
        return DigitalCheckoutResponse(
            session_id=session_id,
            order_ids=order_ids,
            total=0,
            payment_url=free_url,
        )

    db.commit()

    client_ip = request.client.host if request.client else "127.0.0.1"
    payment_url = create_payment_url(
        order_id=session_id,
        amount=total_vnd,
        order_info=f"Lumine {len(products)} digital assets",
        ip_addr=client_ip,
        return_url=body.return_url,
    )

    return DigitalCheckoutResponse(
        session_id=session_id,
        order_ids=order_ids,
        total=total_vnd,
        payment_url=payment_url,
    )


@router.get("/verify", response_model=VerifyResponse)
def verify_payment(
    request: Request,
    db: Session = Depends(get_db),
) -> VerifyResponse:
    params = dict(request.query_params)
    result = verify_return_params(params)

    if not result["is_valid"]:
        return VerifyResponse(success=False, message="Chữ ký không hợp lệ")

    session_id = result["transaction_id"]
    payments: list[Payment] = list(
        db.scalars(select(Payment).where(Payment.transaction_id == session_id)).all()
    )

    if not payments:
        return VerifyResponse(success=False, message="Không tìm thấy giao dịch")

    order_ids: list[str] = []
    success = result["response_code"] == "00"

    for payment in payments:
        order = db.get(Order, payment.order_id)
        if order is None:
            continue
        if success:
            if payment.status != PaymentStatusEnum.PAID:
                payment.status = PaymentStatusEnum.PAID
                db.add(payment)
            if order.status == OrderStatusEnum.PENDING:
                order.status = OrderStatusEnum.PAID
                db.add(order)
        else:
            if payment.status == PaymentStatusEnum.UNPAID:
                payment.status = PaymentStatusEnum.FAILED
                db.add(payment)
        order_ids.append(str(order.id))

    db.commit()

    return VerifyResponse(
        success=success,
        message="Thanh toán thành công" if success else f"Thanh toán thất bại (mã: {result['response_code']})",
        order_ids=order_ids,
        amount=result["amount"],
    )


@router.get("/free-verify", response_model=VerifyResponse)
def verify_free(
    session_id: str,
    db: Session = Depends(get_db),
) -> VerifyResponse:
    payments: list[Payment] = list(
        db.scalars(select(Payment).where(Payment.transaction_id == session_id)).all()
    )
    if not payments:
        return VerifyResponse(success=False, message="Không tìm thấy giao dịch")

    order_ids = [str(p.order_id) for p in payments]
    all_paid = all(p.status == PaymentStatusEnum.PAID for p in payments)

    return VerifyResponse(
        success=all_paid,
        message="Nhận tài nguyên thành công!" if all_paid else "Giao dịch chưa được xác nhận",
        order_ids=order_ids,
        amount=0,
    )
