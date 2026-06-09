from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Product


def get_product(db: Session, product_id) -> Product | None:
    return db.get(Product, product_id)


def create_product(db: Session, **data) -> Product:
    product = Product(**data)
    db.add(product)
    db.flush()
    return product


def search_products(
    db: Session,
    *,
    query: str | None = None,
    category_id=None,
    brand: str | None = None,
    min_price=None,
    max_price=None,
    sort_by: str = "newest",
    offset: int = 0,
    limit: int = 10,
):
    statement = select(Product).where(Product.is_active.is_(True))
    count_statement = select(func.count()).select_from(Product).where(Product.is_active.is_(True))

    if query:
        filter_clause = Product.name.ilike(f"%{query}%") | Product.description.ilike(f"%{query}%")
        statement = statement.where(filter_clause)
        count_statement = count_statement.where(filter_clause)
    if category_id:
        statement = statement.where(Product.category_id == category_id)
        count_statement = count_statement.where(Product.category_id == category_id)
    if brand:
        statement = statement.where(Product.brand == brand)
        count_statement = count_statement.where(Product.brand == brand)
    if min_price is not None:
        statement = statement.where(Product.price >= min_price)
        count_statement = count_statement.where(Product.price >= min_price)
    if max_price is not None:
        statement = statement.where(Product.price <= max_price)
        count_statement = count_statement.where(Product.price <= max_price)

    sort_map = {
        "price_asc": Product.price.asc(),
        "price_desc": Product.price.desc(),
        "sold_desc": Product.sold_quantity.desc(),
        "newest": Product.created_at.desc(),
    }
    statement = statement.order_by(sort_map.get(sort_by, Product.created_at.desc()))
    items = list(db.scalars(statement.offset(offset).limit(limit)).all())
    total_items = int(db.scalar(count_statement) or 0)
    return items, total_items


def list_products_by_store(db: Session, store_id) -> list[Product]:
    return list(db.scalars(select(Product).where(Product.store_id == store_id, Product.is_active.is_(True))).all())


def list_newest_products(db: Session, limit: int = 10) -> list[Product]:
    return list(db.scalars(select(Product).where(Product.is_active.is_(True)).order_by(Product.created_at.desc()).limit(limit)).all())


def list_best_sellers(db: Session, limit: int = 10) -> list[Product]:
    return list(db.scalars(select(Product).where(Product.is_active.is_(True)).order_by(Product.sold_quantity.desc()).limit(limit)).all())


def list_most_viewed(db: Session, limit: int = 10) -> list[Product]:
    return list(db.scalars(select(Product).where(Product.is_active.is_(True)).order_by(Product.view_count.desc()).limit(limit)).all())


def list_suggested(db: Session, limit: int = 10) -> list[Product]:
    return list(db.scalars(select(Product).where(Product.is_active.is_(True)).order_by(func.random()).limit(limit)).all())
