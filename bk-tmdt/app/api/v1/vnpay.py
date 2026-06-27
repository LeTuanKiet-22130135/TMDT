"""VNPay REST API endpoints.

Handles payment URL creation, return callback, IPN, and IPN simulation
for local testing where VNPay cannot reach localhost.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_db
from app.core.config import settings
from app.crud.orders import get_order
from app.crud.payments import create_payment, get_payment_by_order_id
from app.models import Order, OrderStatusEnum, PaymentMethodEnum, PaymentStatusEnum, User
from app.schemas.vnpay import VNPayCreateResponse, VNPayIPNResponse, VNPayReturnResponse, VNPaySimulateResponse
from app.services.vnpay import create_payment_url, verify_return_params


router = APIRouter()


def _is_sandbox() -> bool:
    """Check if VNPay is configured with sandbox URL."""
    return "sandbox" in settings.vnpay_url.lower()


@router.post("/create-payment/{order_id}", response_model=VNPayCreateResponse)
def vnpay_create_payment(
    order_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> VNPayCreateResponse:
    """Create a VNPay payment URL for an order.

    The frontend should redirect the user to the returned URL.
    """
    order = get_order(db, order_id)
    if order is None or order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if order.status != OrderStatusEnum.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order is not in PENDING status")

    # Create or reuse payment record
    payment = get_payment_by_order_id(db, order_id)
    if payment is None:
        payment = create_payment(
            db,
            order_id=order.id,
            method=PaymentMethodEnum.VNPAY,
            status=PaymentStatusEnum.UNPAID,
            transaction_id=str(order_id),
        )
        db.commit()
        db.refresh(payment)
    elif payment.status == PaymentStatusEnum.PAID:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment already completed")

    # Get client IP
    client_ip = request.client.host if request.client else "127.0.0.1"

    # Build VNPay payment URL
    amount = int(order.final_amount)
    payment_url = create_payment_url(
        order_id=str(order.id),
        amount=amount,
        order_info=f"Thanh toan don hang {order.id}",
        ip_addr=client_ip,
    )

    return VNPayCreateResponse(payment_url=payment_url)


@router.get("/return", response_model=VNPayReturnResponse)
def vnpay_return(
    request: Request,
    db: Session = Depends(get_db),
) -> VNPayReturnResponse:
    """Handle VNPay browser redirect after payment.

    VNPay redirects the user's browser here with query params
    containing the payment result and secure hash.
    """
    params = dict(request.query_params)
    result = verify_return_params(params)

    if not result["is_valid"]:
        return VNPayReturnResponse(
            success=False,
            message="Invalid signature",
            response_code=result["response_code"],
        )

    order_id_str = result["transaction_id"]
    try:
        order_id = UUID(order_id_str)
    except (ValueError, TypeError):
        return VNPayReturnResponse(
            success=False,
            message="Invalid transaction reference",
            response_code=result["response_code"],
        )

    order = db.get(Order, order_id)
    if order is None:
        return VNPayReturnResponse(
            success=False,
            message="Order not found",
            order_id=order_id,
            response_code=result["response_code"],
        )

    payment = get_payment_by_order_id(db, order_id)

    # VNPay response code "00" means success
    if result["response_code"] == "00":
        if payment and payment.status != PaymentStatusEnum.PAID:
            payment.status = PaymentStatusEnum.PAID
            payment.transaction_id = result.get("vnpay_transaction_no") or str(order_id)
            db.add(payment)
        if order.status == OrderStatusEnum.PENDING:
            order.status = OrderStatusEnum.PAID
            db.add(order)
        db.commit()

        return VNPayReturnResponse(
            success=True,
            message="Payment successful",
            order_id=order_id,
            transaction_id=result.get("vnpay_transaction_no"),
            response_code="00",
        )
    else:
        if payment and payment.status == PaymentStatusEnum.UNPAID:
            payment.status = PaymentStatusEnum.FAILED
            db.add(payment)
            db.commit()

        return VNPayReturnResponse(
            success=False,
            message=f"Payment failed (code: {result['response_code']})",
            order_id=order_id,
            transaction_id=result.get("vnpay_transaction_no"),
            response_code=result["response_code"],
        )


@router.get("/ipn", response_model=VNPayIPNResponse)
def vnpay_ipn(
    request: Request,
    db: Session = Depends(get_db),
) -> VNPayIPNResponse:
    """Instant Payment Notification endpoint.

    VNPay server calls this endpoint directly (server-to-server).
    In localhost testing, this won't be reachable — use simulate-ipn instead.
    """
    params = dict(request.query_params)
    result = verify_return_params(params)

    if not result["is_valid"]:
        return VNPayIPNResponse(RspCode="97", Message="Invalid Checksum")

    order_id_str = result["transaction_id"]
    try:
        order_id = UUID(order_id_str)
    except (ValueError, TypeError):
        return VNPayIPNResponse(RspCode="01", Message="Order Not Found")

    order = db.get(Order, order_id)
    if order is None:
        return VNPayIPNResponse(RspCode="01", Message="Order Not Found")

    payment = get_payment_by_order_id(db, order_id)
    if payment is None:
        return VNPayIPNResponse(RspCode="01", Message="Payment Not Found")

    # Already processed
    if payment.status == PaymentStatusEnum.PAID:
        return VNPayIPNResponse(RspCode="02", Message="Order Already Confirmed")

    # Verify amount matches
    expected_amount = int(order.final_amount)
    if result["amount"] != expected_amount:
        return VNPayIPNResponse(RspCode="04", Message="Invalid Amount")

    # Process payment
    if result["response_code"] == "00":
        payment.status = PaymentStatusEnum.PAID
        payment.transaction_id = result.get("vnpay_transaction_no") or str(order_id)
        order.status = OrderStatusEnum.PAID
    else:
        payment.status = PaymentStatusEnum.FAILED

    db.add(payment)
    db.add(order)
    db.commit()

    return VNPayIPNResponse(RspCode="00", Message="Confirm Success")


@router.post("/simulate-ipn/{order_id}", response_model=VNPaySimulateResponse)
def vnpay_simulate_ipn(
    order_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> VNPaySimulateResponse:
    """Simulate IPN for local testing.

    Since VNPay cannot reach localhost, this endpoint manually
    updates the payment and order status as if IPN succeeded.
    Only available when VNPay is configured with sandbox URL.
    """
    if not _is_sandbox():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="IPN simulation is only available in sandbox mode",
        )

    order = get_order(db, order_id)
    if order is None or order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if order.status != OrderStatusEnum.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order status is {order.status.value}, expected PENDING",
        )

    payment = get_payment_by_order_id(db, order_id)
    if payment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found for this order")

    if payment.status == PaymentStatusEnum.PAID:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment already completed")

    # Simulate successful IPN
    payment.status = PaymentStatusEnum.PAID
    payment.transaction_id = payment.transaction_id or str(order_id)
    order.status = OrderStatusEnum.PAID

    db.add(payment)
    db.add(order)
    db.commit()
    db.refresh(payment)
    db.refresh(order)

    return VNPaySimulateResponse(
        success=True,
        message="IPN simulated successfully — payment and order marked as PAID",
        order_id=order.id,
        payment_status=payment.status.value,
        order_status=order.status.value,
    )
