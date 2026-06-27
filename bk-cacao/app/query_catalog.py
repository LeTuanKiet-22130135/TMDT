from typing import List, Optional

from app.database import get_db
from app.gql_types import SuggestionProduct, _build_suggestion
from app.models import Product, Store, User


def suggestions(offset: int = 0, limit: int = 20) -> List[SuggestionProduct]:
    limit = min(limit, 100)
    with get_db() as db:
        rows = (
            db.query(Product, Store, User)
            .join(Store, Product.store_id == Store.id)
            .join(User, Store.owner_id == User.id)
            .filter(Product.is_active == True)
            .order_by(Product.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
    return [_build_suggestion(p, u) for p, _s, u in rows]


def suggestions_count() -> int:
    with get_db() as db:
        return db.query(Product).filter(Product.is_active == True).count()


def filtered_suggestions(
    keyword: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    is_free: Optional[bool] = None,
    license_types: Optional[List[str]] = None,
    software_tags: Optional[List[str]] = None,
    format_tags: Optional[List[str]] = None,
    limit: int = 60,
) -> List[SuggestionProduct]:
    from sqlalchemy import or_
    limit = min(limit, 200)
    with get_db() as db:
        q = (
            db.query(Product, Store, User)
            .join(Store, Product.store_id == Store.id)
            .join(User, Store.owner_id == User.id)
            .filter(Product.is_active == True)
        )
        if keyword:
            q = q.filter(Product.name.ilike(f"%{keyword.strip()}%"))
        if is_free:
            q = q.filter(Product.price == 0)
        else:
            if min_price is not None:
                q = q.filter(Product.price >= min_price)
            if max_price is not None:
                q = q.filter(Product.price <= max_price)
        if license_types:
            q = q.filter(Product.license_type.in_(license_types))
        if software_tags:
            q = q.filter(or_(*[Product.software_tags.contains([t]) for t in software_tags]))
        if format_tags:
            q = q.filter(or_(*[Product.format_tags.contains([t]) for t in format_tags]))
        rows = q.order_by(Product.created_at.desc()).limit(limit).all()
    return [_build_suggestion(p, u) for p, _s, u in rows]
