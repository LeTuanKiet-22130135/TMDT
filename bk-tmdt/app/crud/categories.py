from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Category


def get_category(db: Session, category_id) -> Category | None:
    return db.get(Category, category_id)


def get_category_by_name(db: Session, name: str) -> Category | None:
    return db.scalar(select(Category).where(Category.name == name))


def list_categories(db: Session) -> list[Category]:
    return list(db.scalars(select(Category).order_by(Category.name)).all())


def create_category(db: Session, **data) -> Category:
    category = Category(**data)
    db.add(category)
    db.flush()
    return category
