from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import Comment


def create_comment(db: Session, **data) -> Comment:
    comment = Comment(**data)
    db.add(comment)
    db.flush()
    return comment


def get_comment(db: Session, comment_id) -> Comment | None:
    statement = select(Comment).where(Comment.id == comment_id).options(selectinload(Comment.replies))
    return db.scalars(statement).one_or_none()
