from decimal import Decimal
from uuid import UUID

from pydantic import Field

from app.models import OrderStatusEnum, PaymentMethodEnum
from app.schemas.base import ORMModel
from app.schemas.cart import CartProductRead


class CheckoutRequest(ORMModel):
    shipping_address: str = Field(min_length=1)
    payment_method: PaymentMethodEnum
    use_points: int = Field(default=0, ge=0)


class OrderItemRead(ORMModel):
    id: UUID
    product_id: UUID
    unit_price: Decimal
    quantity: int
    product: CartProductRead | None = None


class OrderRead(ORMModel):
    id: UUID
    user_id: UUID
    store_id: UUID
    total_amount: Decimal
    points_used: int
    discount_amount: Decimal
    final_amount: Decimal
    status: OrderStatusEnum
    shipping_address: str
    items: list[OrderItemRead]


class CheckoutResponse(ORMModel):
    orders: list[OrderRead]
    total_amount: Decimal
    points_used: int
    discount_amount: Decimal
    final_amount: Decimal
    payment_transaction_ids: list[str]


class OrderStatusUpdateRequest(ORMModel):
    status: OrderStatusEnum
