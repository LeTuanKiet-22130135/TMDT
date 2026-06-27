from datetime import datetime
from typing import List, Optional
from uuid import UUID

import strawberry

from app.models import Product, Store, User


@strawberry.type
class SuggestionProduct:
    id: str
    name: str
    price: float
    image_url: str
    tags: List[str]
    license_type: str
    software_tags: List[str]
    format_tags: List[str]
    author_name: str
    author_avatar: Optional[str]
    author_shortlink: str
    created_at: Optional[datetime]


@strawberry.type
class AiSearchResult:
    products: List[SuggestionProduct]
    step: str  # hybrid | vi | en | relaxed | notfound
    keyword_used: Optional[str]


def _build_suggestion(product: Product, user: User) -> SuggestionProduct:
    urls = product.image_urls or []
    tags = list(product.user_tags or []) + list(product.ai_tags or [])
    return SuggestionProduct(
        id=str(product.id),
        name=product.name,
        price=float(product.price),
        image_url=urls[0] if urls else "",
        tags=tags,
        license_type=product.license_type or "",
        software_tags=list(product.software_tags or []),
        format_tags=list(product.format_tags or []),
        author_name=user.full_name,
        author_avatar=user.avatar_url,
        author_shortlink=user.shortlink or "",
        created_at=product.created_at,
    )


def _fetch_products_by_ids(db, product_ids: List[UUID]) -> dict:
    """Returns {str(product.id): (product, user)}."""
    rows = (
        db.query(Product, Store, User)
        .join(Store, Product.store_id == Store.id)
        .join(User, Store.owner_id == User.id)
        .filter(Product.id.in_(product_ids), Product.is_active == True)
        .all()
    )
    return {str(p.id): (p, u) for p, _s, u in rows}
