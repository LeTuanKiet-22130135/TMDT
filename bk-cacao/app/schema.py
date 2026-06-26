from datetime import datetime
from typing import List, Optional
from uuid import UUID

import strawberry

from app.agent import ask_agent, extract_search_query
from app.database import get_db
from app.models import Product, Store, User
from app.recommendation import (
    get_recommendations,
    index_product_full,
    rebuild_all_product_profiles,
    search_by_embedding,
    track_event as _track_event,
)


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

    @strawberry.field
    def semantic_search_products(self, query: str, limit: int = 20) -> List[SuggestionProduct]:
        """Semantic similarity search using product embeddings."""
        limit = min(limit, 100)
        with get_db() as db:
            scored = search_by_embedding(db, query, limit)
            if not scored:
                return []
            product_ids = [UUID(pid) for pid, _ in scored]
            product_map = _fetch_products_by_ids(db, product_ids)

        results = []
        for pid, _ in scored:
            if pid in product_map:
                p, u = product_map[pid]
                results.append(_build_suggestion(p, u))
        return results

    @strawberry.field
    def filtered_suggestions(
        self,
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

    @strawberry.field
    def personalized_recommendations(
        self, user_id: str, limit: int = 50
    ) -> List[SuggestionProduct]:
        """
        Returns up to `limit` products. Personalized results first (cosine similarity),
        padded with random products to always reach `limit`.
        """
        import random as _random
        limit = min(limit, 100)
        with get_db() as db:
            scored = get_recommendations(db, user_id, limit)
            seen_ids: set[str] = set()
            results: List[SuggestionProduct] = []

            if scored:
                product_ids = [UUID(pid) for pid, _ in scored]
                product_map = _fetch_products_by_ids(db, product_ids)
                for pid, _ in scored:
                    if pid in product_map:
                        p, u = product_map[pid]
                        results.append(_build_suggestion(p, u))
                        seen_ids.add(pid)

            # Pad with random products to reach limit
            if len(results) < limit:
                needed = limit - len(results)
                pad_rows = (
                    db.query(Product, Store, User)
                    .join(Store, Product.store_id == Store.id)
                    .join(User, Store.owner_id == User.id)
                    .filter(Product.is_active == True)
                    .filter(~Product.id.in_([UUID(x) for x in seen_ids]) if seen_ids else True)
                    .order_by(Product.id)  # stable ordering before Python shuffle
                    .limit(needed * 3)     # fetch extra so shuffle has variety
                    .all()
                )
                _random.shuffle(pad_rows)
                for p, _s, u in pad_rows[:needed]:
                    results.append(_build_suggestion(p, u))

        return results


@strawberry.type
class Mutation:
    @strawberry.mutation
    def ask_ai(self, prompt: str) -> str:
        return ask_agent(prompt)

    @strawberry.mutation
    def track_event(self, user_id: str, product_id: str, event_type: str) -> bool:
        """
        Record a user interaction event and update recommendation profile.
        event_type: view | cart | search | follow | purchase
        """
        with get_db() as db:
            return _track_event(db, user_id, product_id, event_type)

    @strawberry.mutation
    def index_product(self, product_id: str) -> bool:
        """
        Build tag_vector + embedding for a product.
        Called by bk-tmdt after product creation.
        """
        with get_db() as db:
            return index_product_full(db, product_id)

    @strawberry.mutation
    def rebuild_product_profiles(self) -> int:
        """Recompute tag vectors for all active products. Returns count."""
        with get_db() as db:
            return rebuild_all_product_profiles(db)


def _is_valid_uuid(val: str) -> bool:
    try:
        UUID(val)
        return True
    except ValueError:
        return False


schema = strawberry.Schema(query=Query, mutation=Mutation)
