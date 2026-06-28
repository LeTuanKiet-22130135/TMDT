from decimal import Decimal
from typing import Optional
from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.entities import WalletStatusEnum, WalletTransactionStatusEnum, WalletTransactionTypeEnum


class WalletTopupRequest(BaseModel):
    amount: Decimal = Field(..., ge=50000, description="Số tiền nạp tối thiểu là 50,000 VND")


class WalletTopupResponse(BaseModel):
    payment_url: str


class WalletResponse(BaseModel):
    id: UUID
    user_id: UUID
    balance: Decimal
    status: WalletStatusEnum
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WalletTransactionResponse(BaseModel):
    id: UUID
    wallet_id: UUID
    transaction_type: WalletTransactionTypeEnum
    amount: Decimal
    balance_before: Decimal
    balance_after: Decimal
    status: WalletTransactionStatusEnum
    reference_id: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class VNPayReturnResponse(BaseModel):
    success: bool
    message: str
    transaction_id: Optional[str] = None
    response_code: str


class VNPayIPNResponse(BaseModel):
    RspCode: str
    Message: str


class VNPaySimulateResponse(BaseModel):
    success: bool
    message: str
    transaction_id: UUID
    status: str
