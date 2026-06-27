import random as _random
from typing import List
from uuid import UUID

from app.database import get_db
from app.gql_types import SuggestionProduct, _build_suggestion, _fetch_products_by_ids
from app.models import Product, Store, User
from app.recommendation import get_recommendations, search_by_embedding


def semantic_search_products(query: str, limit: int = 20) -> List[SuggestionProduct]:
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


def personalized_recommendations(user_id: str, limit: int = 50) -> List[SuggestionProduct]:
    """
    Returns up to `limit` products. Personalized results first (cosine similarity),
    padded with random products to always reach `limit`.
    """
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

        if len(results) < limit:
            needed = limit - len(results)
            pad_rows = (
                db.query(Product, Store, User)
                .join(Store, Product.store_id == Store.id)
                .join(User, Store.owner_id == User.id)
                .filter(Product.is_active == True)
                .filter(~Product.id.in_([UUID(x) for x in seen_ids]) if seen_ids else True)
                .order_by(Product.id)
                .limit(needed * 3)
                .all()
            )
            _random.shuffle(pad_rows)
            for p, _s, u in pad_rows[:needed]:
                results.append(_build_suggestion(p, u))

    return results
