from decimal import Decimal
from uuid import UUID

from pydantic import Field

from app.schemas.base import ORMModel


class StoreCreate(ORMModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None


class StoreRead(ORMModel):
    id: UUID
    owner_id: UUID
    name: str
    description: str | None = None
    rating: Decimal


class StoreSearchResponse(ORMModel):
    items: list[StoreRead]
    total_items: int
    total_pages: int
