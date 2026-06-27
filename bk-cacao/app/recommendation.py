"""
Recommendation engine — Content-based filtering with weighted user profile.

Scoring:
  view     +1  (cap 3 per product)
  cart     +2  (cap 2 per product)
  search   +2  (cap 2 per product)
  follow   +2  (cap 1 per product — fires once when user follows an author)
  purchase +5  (cap 3 per product)

User profile = accumulated sum of (product_vector * event_weight), dampened by per-product caps.
Recommendations = cosine_similarity(user_profile, product_vector) for all products.
"""

import math
from typing import Dict, List, Tuple
from uuid import uuid4

from sqlalchemy.orm import Session

from app.embeddings import embed_product, embed_query
from app.models import Product, ProductRedProfile, Store, UserRedProfile

EVENT_WEIGHTS: Dict[str, int] = {
    "view": 2,
    "cart": 4,
    "search": 3,
    "follow": 4,
    "purchase": 8,
}

# Max times an event contributes per (user, product) pair — dampening ceiling
EVENT_CAPS: Dict[str, int] = {
    "view": 1,
    "cart": 1,
    "search": 1,
    "follow": 1,
    "purchase": 1,
}


def _normalize(vec: Dict[str, float]) -> Dict[str, float]:
    norm = math.sqrt(sum(v * v for v in vec.values()))
    if norm == 0:
        return vec
    return {k: v / norm for k, v in vec.items()}


def compute_product_vector(tags: List[str]) -> Dict[str, float]:
    """Normalized TF vector from tag list."""
    if not tags:
        return {}
    tf: Dict[str, float] = {}
    for tag in tags:
        tf[tag] = tf.get(tag, 0.0) + 1.0
    return _normalize({k: v / len(tags) for k, v in tf.items()})


def cosine_sim(a: Dict[str, float], b: Dict[str, float]) -> float:
    dot = sum(a.get(tag, 0.0) * score for tag, score in b.items())
    norm_a = math.sqrt(sum(v * v for v in a.values()))
    norm_b = math.sqrt(sum(v * v for v in b.values()))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def _ensure_product_profile(db: Session, product_id: str) -> ProductRedProfile | None:
    """Get or build ProductRedProfile on demand."""
    pp = db.query(ProductRedProfile).filter_by(product_id=product_id).first()
    if pp:
        return pp
    product = db.query(Product).filter_by(id=product_id).first()
    if not product:
        return None
    tags = list(product.user_tags or []) + list(product.ai_tags or [])
    vector = compute_product_vector(tags)
    pp = ProductRedProfile(id=uuid4(), product_id=product_id, tag_vector=vector)
    db.add(pp)
    return pp


def track_event(db: Session, user_id: str, product_id: str, event_type: str) -> bool:
    """
    Record a user interaction event and update their profile vector.
    Returns False if event_type is unknown or product not found.
    """
    if event_type not in EVENT_WEIGHTS:
        return False

    profile = db.query(UserRedProfile).filter_by(user_id=user_id).first()
    if not profile:
        profile = UserRedProfile(id=uuid4(), user_id=user_id, tag_weights={}, event_log={})
        db.add(profile)

    prod_profile = _ensure_product_profile(db, product_id)
    if not prod_profile:
        return False

    event_log: Dict = dict(profile.event_log or {})
    prod_log: Dict = dict(event_log.get(product_id, {}))
    current_count = prod_log.get(event_type, 0)
    cap = EVENT_CAPS[event_type]

    if current_count < cap:
        weight = EVENT_WEIGHTS[event_type]
        tag_weights: Dict[str, float] = dict(profile.tag_weights or {})
        for tag, score in (prod_profile.tag_vector or {}).items():
            tag_weights[tag] = tag_weights.get(tag, 0.0) + score * weight
        prod_log[event_type] = current_count + 1
        event_log[product_id] = prod_log
        profile.tag_weights = tag_weights
        profile.event_log = event_log

    db.commit()
    return True


def _get_excluded_product_ids(db: Session, user_id: str, event_log: Dict) -> set:
    """Products to exclude: already purchased + owned by user."""
    purchased = {
        pid for pid, events in event_log.items()
        if events.get("purchase", 0) > 0
    }
    user_stores = db.query(Store).filter_by(owner_id=user_id).all()
    own_ids: set = set()
    if user_stores:
        store_ids = [s.id for s in user_stores]
        rows = db.query(Product.id).filter(Product.store_id.in_(store_ids)).all()
        own_ids = {str(r.id) for r in rows}
    return purchased | own_ids


def get_recommendations(db: Session, user_id: str, limit: int = 20) -> List[Tuple[str, float]]:
    """Returns [(product_id, score)] sorted desc. Empty if no profile."""
    profile = db.query(UserRedProfile).filter_by(user_id=user_id).first()
    if not profile or not profile.tag_weights:
        return []

    exclude_ids = _get_excluded_product_ids(db, user_id, profile.event_log or {})
    tag_weights: Dict[str, float] = profile.tag_weights
    all_pp = db.query(ProductRedProfile).all()

    scored = [
        (str(pp.product_id), cosine_sim(tag_weights, pp.tag_vector))
        for pp in all_pp
        if pp.tag_vector and str(pp.product_id) not in exclude_ids
    ]
    scored.sort(key=lambda x: x[1], reverse=True)
    return scored[:limit]


def _cosine_sim_list(a: List[float], b: List[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def index_product_full(db: Session, product_id: str) -> bool:
    """
    Build and persist both tag_vector and embedding for a product.
    Called asynchronously after product creation.
    Returns False if product not found.
    """
    product = db.query(Product).filter_by(id=product_id).first()
    if not product:
        return False

    tags = list(product.user_tags or []) + list(product.ai_tags or [])
    vector = compute_product_vector(tags)

    try:
        emb = embed_product(product.name, getattr(product, "description", None), tags)
    except Exception as e:
        print(f"[cacao] embedding failed for {product_id}: {e}")
        emb = None

    existing = db.query(ProductRedProfile).filter_by(product_id=product_id).first()
    if existing:
        existing.tag_vector = vector
        existing.embedding = emb
    else:
        db.add(ProductRedProfile(
            id=uuid4(),
            product_id=product_id,
            tag_vector=vector,
            embedding=emb,
        ))
    db.commit()
    return True


def search_by_embedding(db: Session, query_text: str, limit: int = 20) -> List[Tuple[str, float]]:
    """
    Semantic search via pgvector ANN (<=> cosine distance).
    Returns [(product_id, score)] sorted desc.
    """
    try:
        query_emb = embed_query(query_text)
    except Exception as e:
        print(f"[cacao] query embedding failed: {e}")
        return []

    from sqlalchemy import literal, cast
    from pgvector.sqlalchemy import Vector
    from app.models import EMBEDDING_DIM

    vec_literal = cast(query_emb, Vector(EMBEDDING_DIM))
    rows = (
        db.query(
            ProductRedProfile.product_id,
            (1 - ProductRedProfile.embedding.cosine_distance(vec_literal)).label("score"),
        )
        .filter(ProductRedProfile.embedding.isnot(None))
        .order_by(ProductRedProfile.embedding.cosine_distance(vec_literal))
        .limit(limit)
        .all()
    )
    return [(str(row.product_id), float(row.score)) for row in rows]


def rebuild_all_product_profiles(db: Session) -> int:
    """Recompute tag vectors for all active products (no re-embed). Returns count rebuilt."""
    products = db.query(Product).filter_by(is_active=True).all()
    for product in products:
        tags = list(product.user_tags or []) + list(product.ai_tags or [])
        vector = compute_product_vector(tags)
        pid = str(product.id)
        existing = db.query(ProductRedProfile).filter_by(product_id=pid).first()
        if existing:
            existing.tag_vector = vector
        else:
            db.add(ProductRedProfile(id=uuid4(), product_id=pid, tag_vector=vector))
    db.commit()
    return len(products)
