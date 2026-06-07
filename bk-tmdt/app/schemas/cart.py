from decimal import Decimal
from uuid import UUID

from pydantic import Field

from app.schemas.base import ORMModel


class CartItemAddRequest(ORMModel):
    product_id: UUID
    quantity: int = Field(ge=1, default=1)


class CartItemUpdateRequest(ORMModel):
    quantity: int = Field(ge=1)


class CartProductRead(ORMModel):
    id: UUID
    name: str
    price: Decimal
    store_id: UUID
    image_urls: list[str]


class CartItemRead(ORMModel):
    product_id: UUID
    quantity: int
    unit_price: Decimal
    line_total: Decimal
    product: CartProductRead


class CartRead(ORMModel):
    items: list[CartItemRead]
    total_amount: Decimal
