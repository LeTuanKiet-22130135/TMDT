from datetime import datetime
from typing import List, Optional
from uuid import UUID

import strawberry

from app.agent import ask_agent, extract_search_query
from app.database import get_db
from app.models import Product, Store, User


@strawberry.type
class SuggestionProduct:
    id: str
    name: str
    price: float
    image_url: str
    tags: List[str]
    license_type: str
    author_name: str
    author_avatar: Optional[str]
    author_shortlink: str
    created_at: Optional[datetime]


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
        author_name=user.full_name,
        author_avatar=user.avatar_url,
        author_shortlink=user.shortlink or "",
        created_at=product.created_at,
    )


@strawberry.type
class Query:
    @strawberry.field
    def suggestions(self, offset: int = 0, limit: int = 20) -> List[SuggestionProduct]:
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

    @strawberry.field
    def suggestions_count(self) -> int:
        with get_db() as db:
            return db.query(Product).filter(Product.is_active == True).count()

    @strawberry.field
    def search_products_by_ai(self, prompt: str) -> List[SuggestionProduct]:
        params = extract_search_query(prompt)

        with get_db() as db:
            query = (
                db.query(Product, Store, User)
                .join(Store, Product.store_id == Store.id)
                .join(User, Store.owner_id == User.id)
                .filter(Product.is_active == True)
            )

            if params.name:
                query = query.filter(Product.name.ilike(f"%{params.name}%"))

            if params.min_price is not None:
                query = query.filter(Product.price >= params.min_price)
            if params.max_price is not None:
                query = query.filter(Product.price <= params.max_price)

            rows = query.limit(20).all()

        return [_build_suggestion(p, u) for p, _s, u in rows]


@strawberry.type
class Mutation:
    @strawberry.mutation
    def ask_ai(self, prompt: str) -> str:
        return ask_agent(prompt)


def _is_valid_uuid(val: str) -> bool:
    try:
        UUID(val)
        return True
    except ValueError:
        return False


schema = strawberry.Schema(query=Query, mutation=Mutation)
