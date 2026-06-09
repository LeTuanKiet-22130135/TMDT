from decimal import Decimal
from uuid import UUID

from pydantic import Field

from app.schemas.base import ORMModel


class ProductCreate(ORMModel):
    category_id: UUID
    name: str = Field(min_length=1, max_length=255)
    description: str
    price: Decimal = Field(gt=0)
    stock_quantity: int = Field(ge=0, default=0)
    brand: str | None = None
    image_urls: list[str] = Field(default_factory=list)


class ProductUpdate(ORMModel):
    category_id: UUID | None = None
    name: str | None = Field(default=None, max_length=255)
    description: str | None = None
    price: Decimal | None = Field(default=None, gt=0)
    stock_quantity: int | None = Field(default=None, ge=0)
    brand: str | None = None
    image_urls: list[str] | None = None
    is_active: bool | None = None


class ProductRead(ORMModel):
    id: UUID
    store_id: UUID
    category_id: UUID
    name: str
    description: str
    price: Decimal
    stock_quantity: int
    sold_quantity: int
    view_count: int
    brand: str | None = None
    image_urls: list[str]
    is_active: bool


class ProductListResponse(ORMModel):
    items: list[ProductRead]
    total_items: int
    total_pages: int
