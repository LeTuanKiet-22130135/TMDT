"""Wallet REST API endpoints for top-ups and payments."""

import uuid
from decimal import Decimal
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.api.dependencies import get_current_user, get_db
from app.core.config import settings
from app.models.entities import (
    User,
    Wallet,
    WalletTransaction,
    PaymentLog,
    WalletStatusEnum,
    WalletTransactionStatusEnum,
    WalletTransactionTypeEnum,
)
from app.schemas.wallet import (
    WalletTopupRequest,
    WalletTopupResponse,
    VNPayReturnResponse,
    VNPayIPNResponse,
    VNPaySimulateResponse,
)
from app.services.vnpay import create_payment_url, verify_return_params

router = APIRouter()


def _is_sandbox() -> bool:
    """Kiểm tra xem VNPay có đang dùng sandbox URL hay không."""
    return "sandbox" in settings.vnpay_url.lower()


@router.post("/topup", response_model=WalletTopupResponse)
def topup_wallet(
    request: Request,
    payload: WalletTopupRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Tạo URL thanh toán VNPay để nạp tiền vào ví."""
    if payload.amount < 50000:
        raise HTTPException(status_code=400, detail="Số tiền nạp tối thiểu là 50,000 VND")

    # Lấy hoặc tạo ví cho user nếu chưa có
    wallet = db.query(Wallet).filter(Wallet.user_id == current_user.id).first()
    if not wallet:
        wallet = Wallet(user_id=current_user.id, balance=Decimal("0.00"), status=WalletStatusEnum.ACTIVE)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)

    if wallet.status == WalletStatusEnum.LOCKED:
        raise HTTPException(status_code=403, detail="Ví của bạn đã bị khóa")

    # Tạo giao dịch nạp tiền PENDING
    transaction = WalletTransaction(
        wallet_id=wallet.id,
        transaction_type=WalletTransactionTypeEnum.TOPUP,
        amount=payload.amount,
        balance_before=wallet.balance,
        balance_after=wallet.balance,
        status=WalletTransactionStatusEnum.PENDING,
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    client_ip = request.client.host if request.client else "127.0.0.1"
    
    # Tạo URL VNPay
    payment_url = create_payment_url(
        order_id=str(transaction.id),
        amount=int(payload.amount),
        order_info=f"Nap tien vao vi: {transaction.id}",
        ip_addr=client_ip,
        return_url=payload.return_url or f"{settings.api_v1_prefix}/wallet/vnpay-return",
    )

    return {"payment_url": payment_url}


@router.get("/vnpay-return", response_model=VNPayReturnResponse)
def vnpay_return(request: Request, db: Session = Depends(get_db)) -> Any:
    """Xử lý VNPay trả về cho người dùng qua trình duyệt (Browser redirect)."""
    params = dict(request.query_params)
    result = verify_return_params(params)
    
    # Log the return payload if needed
    log_entry = PaymentLog(
        endpoint="vnpay_return",
        request_payload=params,
        response_payload=result,
        wallet_transaction_id=uuid.UUID(result["transaction_id"]) if result["transaction_id"] else None
    )
    db.add(log_entry)
    db.commit()

    if not result["is_valid"]:
        return {"success": False, "message": "Chữ ký không hợp lệ", "response_code": result["response_code"]}

    txn_id_str = result["transaction_id"]
    try:
        txn_id = uuid.UUID(txn_id_str)
    except (ValueError, TypeError):
        return {"success": False, "message": "Mã giao dịch không hợp lệ", "response_code": result["response_code"]}

    transaction = db.get(WalletTransaction, txn_id)
    if not transaction:
        return {"success": False, "message": "Không tìm thấy giao dịch", "response_code": result["response_code"]}

    # Cập nhật số dư nếu chưa được xử lý bởi IPN
    if result["response_code"] == "00":
        if transaction.status == WalletTransactionStatusEnum.PENDING:
            wallet = db.get(Wallet, transaction.wallet_id)
            if wallet and wallet.status == WalletStatusEnum.ACTIVE:
                balance_before = wallet.balance
                wallet.balance += transaction.amount
                transaction.status = WalletTransactionStatusEnum.SUCCESS
                transaction.balance_before = balance_before
                transaction.balance_after = wallet.balance
                transaction.gateway_transaction_id = result.get("vnpay_transaction_no")
                db.add(wallet)
                db.add(transaction)
                db.commit()

        return {
            "success": True,
            "message": "Nạp tiền thành công",
            "transaction_id": txn_id_str,
            "response_code": "00"
        }
    else:
        if transaction.status == WalletTransactionStatusEnum.PENDING:
            transaction.status = WalletTransactionStatusEnum.FAILED
            db.add(transaction)
            db.commit()
            
        return {
            "success": False,
            "message": f"Nạp tiền thất bại (mã lỗi: {result['response_code']})",
            "transaction_id": txn_id_str,
            "response_code": result["response_code"]
        }


@router.get("/vnpay-ipn", response_model=VNPayIPNResponse)
def vnpay_ipn(request: Request, db: Session = Depends(get_db)) -> Any:
    """Instant Payment Notification: Server-to-server webhook từ VNPay.
    Áp dụng Pessimistic Locking để chống gọi nhiều lần cho cùng 1 IPN.
    """
    params = dict(request.query_params)
    result = verify_return_params(params)
    
    txn_id_str = result["transaction_id"]
    
    try:
        txn_id = uuid.UUID(txn_id_str) if txn_id_str else None
    except (ValueError, TypeError):
        txn_id = None

    # Log request from VNPay
    log_entry = PaymentLog(
        endpoint="vnpay_ipn",
        request_payload=params,
        response_payload={"is_valid": result["is_valid"]},
        wallet_transaction_id=txn_id
    )
    db.add(log_entry)
    db.commit()

    if not result["is_valid"]:
        return {"RspCode": "97", "Message": "Invalid Checksum"}

    if not txn_id:
        return {"RspCode": "01", "Message": "Order Not Found"}

    try:
        # Khóa bản ghi Transaction (Pessimistic Lock)
        transaction = db.query(WalletTransaction).filter(
            WalletTransaction.id == txn_id
        ).with_for_update().first()
        
        if not transaction:
            return {"RspCode": "01", "Message": "Order Not Found"}
            
        if transaction.status != WalletTransactionStatusEnum.PENDING:
            return {"RspCode": "02", "Message": "Order already confirmed"}
            
        if transaction.amount != result["amount"]:
            return {"RspCode": "04", "Message": "Invalid amount"}

        # Khóa bản ghi Wallet để cộng tiền (Pessimistic Lock)
        wallet = db.query(Wallet).filter(
            Wallet.id == transaction.wallet_id
        ).with_for_update().first()
        
        if not wallet or wallet.status == WalletStatusEnum.LOCKED:
            transaction.status = WalletTransactionStatusEnum.FAILED
            db.commit()
            return {"RspCode": "00", "Message": "Confirm Success (Wallet Locked/Not Found)"}

        balance_before = wallet.balance

        if result["response_code"] == "00":
            wallet.balance += transaction.amount
            transaction.status = WalletTransactionStatusEnum.SUCCESS
        else:
            transaction.status = WalletTransactionStatusEnum.FAILED

        transaction.balance_before = balance_before
        transaction.balance_after = wallet.balance
        transaction.gateway_transaction_id = result.get("vnpay_transaction_no")
        transaction.gateway_response_code = result.get("response_code")
        
        db.commit()
        return {"RspCode": "00", "Message": "Confirm Success"}
        
    except Exception as e:
        db.rollback()
        return {"RspCode": "99", "Message": "Unknown error"}


@router.post("/simulate-ipn/{transaction_id}", response_model=VNPaySimulateResponse)
def simulate_ipn(
    transaction_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Endpoint giả lập IPN để test trên Localhost."""
    if not _is_sandbox():
        raise HTTPException(status_code=403, detail="Chỉ hỗ trợ trong môi trường sandbox")

    try:
        transaction = db.query(WalletTransaction).filter(
            WalletTransaction.id == transaction_id
        ).with_for_update().first()
        
        if not transaction:
            raise HTTPException(status_code=404, detail="Không tìm thấy giao dịch")
            
        if transaction.status != WalletTransactionStatusEnum.PENDING:
            raise HTTPException(status_code=400, detail="Giao dịch đã được xử lý")

        wallet = db.query(Wallet).filter(
            Wallet.id == transaction.wallet_id
        ).with_for_update().first()
        
        if not wallet or wallet.status == WalletStatusEnum.LOCKED:
            raise HTTPException(status_code=400, detail="Ví bị khóa hoặc không tìm thấy")

        balance_before = wallet.balance
        wallet.balance += transaction.amount
        transaction.status = WalletTransactionStatusEnum.SUCCESS
        transaction.balance_before = balance_before
        transaction.balance_after = wallet.balance
        transaction.gateway_response_code = "00"
        
        db.commit()
        
        return {
            "success": True,
            "message": "Giả lập IPN thành công, đã cộng tiền vào ví",
            "transaction_id": transaction.id,
            "status": transaction.status.value
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Lỗi nội bộ server")
