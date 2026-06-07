from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Store


def get_store(db: Session, store_id) -> Store | None:
    return db.get(Store, store_id)


def get_store_by_owner(db: Session, owner_id) -> Store | None:
    return db.scalar(select(Store).where(Store.owner_id == owner_id))


def get_store_by_name(db: Session, name: str) -> Store | None:
    return db.scalar(select(Store).where(Store.name == name))


def search_stores(db: Session, query: str | None = None) -> list[Store]:
    statement = select(Store)
    if query:
        statement = statement.where(Store.name.ilike(f"%{query}%"))
    statement = statement.order_by(Store.name)
    return list(db.scalars(statement).all())


def create_store(db: Session, **data) -> Store:
    store = Store(**data)
    db.add(store)
    db.flush()
    return store


def store_rating_average(db: Session, store_id):
    return db.scalar(select(func.avg(Store.rating)).where(Store.id == store_id))
