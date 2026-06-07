from datetime import datetime
from decimal import Decimal
from uuid import UUID

from app.models import PaymentMethodEnum, PaymentStatusEnum
from app.schemas.base import ORMModel


class PaymentRead(ORMModel):
    id: UUID
    order_id: UUID
    method: PaymentMethodEnum
    status: PaymentStatusEnum
    transaction_id: str | None
    created_at: datetime


class PaymentWebhookRequest(ORMModel):
    transaction_id: str
    payment_status: PaymentStatusEnum
    order_id: UUID | None = None


class PaymentWebhookResponse(ORMModel):
    payment: PaymentRead
    order_status: str


class PaymentInitiateRequest(ORMModel):
    method: PaymentMethodEnum
