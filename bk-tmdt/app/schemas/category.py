from uuid import UUID

from pydantic import Field

from app.schemas.base import ORMModel


class CategoryBase(ORMModel):
    name: str = Field(min_length=1, max_length=100)
    parent_id: UUID | None = None
    description: str | None = None


class CategoryCreate(CategoryBase):
    pass


class CategoryRead(CategoryBase):
    id: UUID
