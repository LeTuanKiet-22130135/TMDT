from uuid import UUID

from pydantic import Field

from app.schemas.base import ORMModel


class CommentCreate(ORMModel):
    content: str = Field(min_length=1)


class CommentRead(ORMModel):
    id: UUID
    user_id: UUID
    product_id: UUID
    parent_id: UUID | None
    content: str
