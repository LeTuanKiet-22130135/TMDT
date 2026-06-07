from decimal import Decimal
from uuid import UUID

from pydantic import Field

from app.schemas.base import ORMModel


class ReviewCreate(ORMModel):
    order_item_id: UUID
    product_id: UUID
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=1)


class ReviewRead(ORMModel):
    id: UUID
    user_id: UUID
    product_id: UUID
    order_item_id: UUID
    rating: int
    comment: str


class StoreRatingRead(ORMModel):
    store_id: UUID
    rating: Decimal
