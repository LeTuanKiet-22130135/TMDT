from datetime import datetime
from difflib import SequenceMatcher
from typing import List, Optional
from uuid import UUID

import strawberry

from app.agent import ask_agent, extract_search_query, translate_to_english, ProductSearchQuery
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


def _tag_fuzzy_score(
    query_tags: List[str],
    product_tags: List[str],
    strict: bool = False,
) -> float:
    """
    Bidirectional tag overlap scoring.

    Normal mode (strict=False): F1 of recall + precision + richness bonus.
    Strict mode (strict=True):
      - Tag sai (query tag ko match bất kỳ product tag nào) bị BO QUA, ko tính vào mẫu số.
      - Score = matched_query_tags / valid_query_tags (chỉ dùng recall-precision trên tập đã match).
      - Phần thưởng product nhiều tags vẫn giữ.
    """
    if not query_tags or not product_tags:
        return 0.0

    _stop = {'the', 'a', 'an', 'and', 'or', 'of', 'in', 'for', 'to', 'is', 'are', 'with', 'by', 'on'}

    def _tokenize(tags: List[str]) -> List[set]:
        """Return list of word-sets per tag."""
        result = []
        for t in tags:
            words = {w for w in t.lower().replace('_', ' ').split() if w not in _stop and len(w) > 2}
            if words:
                result.append(words)
        return result

    q_tag_sets = _tokenize(query_tags)
    p_words = set()
    for ws in _tokenize(product_tags):
        p_words.update(ws)

    if not q_tag_sets or not p_words:
        return 0.0

    def _tag_matches(tag_words: set, pool: set) -> bool:
        """True if any word in tag_words has a substring match in pool."""
        return any(tw in pw or pw in tw for tw in tag_words for pw in pool)

    if strict:
        # Strict: only count query tags that DO match; ignore those that don't
        matched_tags = [ws for ws in q_tag_sets if _tag_matches(ws, p_words)]
        valid_count = len(matched_tags)  # denominator = only tags that matched
        if valid_count == 0:
            return 0.0
        # Score = fraction of matched query words found per matched tag (avg coverage)
        coverage = sum(
            sum(1 for w in ws if any(w in pw or pw in w for pw in p_words)) / len(ws)
            for ws in matched_tags
        ) / valid_count
        # Confidence bonus: more matched tags = higher score
        match_ratio = valid_count / len(q_tag_sets)
        return min(coverage * match_ratio + 0.05 * min(valid_count / 5, 1.0), 1.0)

    else:
        # Normal: F1 of recall + precision
        q_words = set()
        for ws in q_tag_sets:
            q_words.update(ws)

        def _matches(a_words: set, b_words: set) -> float:
            matched = sum(1 for aw in a_words if any(aw in bw or bw in aw for bw in b_words))
            return matched / len(a_words)

        recall = _matches(q_words, p_words)
        precision = _matches(p_words, q_words)

        if recall + precision == 0:
            return 0.0

        f1 = 2 * recall * precision / (recall + precision)
        richness = min(len(product_tags) / 30.0, 1.0) * 0.1
        return min(f1 + richness * recall, 1.0)


def _primary_tag_score(primary_tags: List[str], product_tags: List[str]) -> float:
    """
    Near-exact matching for primary (core identity) tags.
    A primary tag 'matches' a product tag when:
      - SequenceMatcher ratio >= 0.9 (handles plural, minor typo), OR
      - All words of primary tag appear as exact words in the product tag.
    Score = matched_primary_count / len(primary_tags). Range 0.0 - 1.0.
    """
    if not primary_tags or not product_tags:
        return 0.0

    def _normalize(s: str) -> str:
        return s.lower().replace('_', ' ').strip()

    norm_product_tags = [_normalize(t) for t in product_tags]

    def _tag_matches(ptag: str) -> bool:
        np_tag = _normalize(ptag)
        for qt in norm_product_tags:
            if SequenceMatcher(None, np_tag, qt).ratio() >= 0.9:
                return True
            # Criterion 2: all words in primary tag are full words in product tag
            p_words = set(np_tag.split())
            q_words = set(qt.split())
            if p_words and p_words.issubset(q_words):
                return True
        return False

    matched = sum(1 for pt in primary_tags if _tag_matches(pt))
    return matched / len(primary_tags)


def _hybrid_search(
    prompt: str,
    danbooru_tags: List[str],
    db,
    limit: int = 20,
    sem_weight: float = 0.4,
    tag_weight: float = 0.6,
    high_confidence: bool = False,
    primary_tags: Optional[List[str]] = None,
) -> List[tuple]:
    """
    Combines pgvector semantic + danbooru tag fuzzy + primary tag near-exact.

    Scoring:
      combined_score = sem_weight * sem + tag_weight * tag
      final_score    = combined_score + primary_score * 3.0

    Primary score dominates: any product with primary match always ranks above
    products without, regardless of semantic score.

    high_confidence=True: strict tag scoring (wrong tags ignored), filter threshold.
    Writes detailed scoring breakdown to logs/shiro_scoring.log.
    """
    import os
    from datetime import datetime as _dt

    strict = high_confidence and bool(danbooru_tags)
    if strict:
        sem_weight = 0.25
        tag_weight = 0.75

    has_primary = bool(primary_tags)
    fetch_limit = min(limit * 5, 100) if (strict or has_primary) else min(limit * 3, 60)
    candidates = search_by_embedding(db, prompt, limit=fetch_limit)
    if not candidates:
        return []

    product_ids = [UUID(pid) for pid, _ in candidates]
    product_map = _fetch_products_by_ids(db, product_ids)

    # --- Scoring with per-candidate log entries ---
    log_entries: list[dict] = []
    results = []

    for pid, sem_score in candidates:
        if pid not in product_map:
            continue
        p, u = product_map[pid]
        all_tags = list(p.user_tags or []) + list(p.ai_tags or [])

        tag_score = _tag_fuzzy_score(danbooru_tags, all_tags, strict=strict) if danbooru_tags else 0.0

        filter_reason: Optional[str] = None

        if strict and tag_score < 0.05:
            filter_reason = f"strict_tag_filter (tag_score={tag_score:.3f} < 0.05)"
        else:
            p_score = _primary_tag_score(primary_tags, all_tags) if has_primary else 0.0
            if has_primary and p_score == 0.0:
                filter_reason = "primary_miss (p_score=0, no primary tag matched)"
            else:
                combined = sem_weight * sem_score + tag_weight * tag_score
                final = combined + p_score * 3.0
                results.append((p, u, final, p_score))

        # Build log entry regardless of filter
        entry: dict = {
            "product_id": pid,
            "product_name": p.name,
            "product_tags": all_tags,
            "sem_score": round(sem_score, 4),
            "sem_weight": sem_weight,
            "sem_contrib": round(sem_score * sem_weight, 4),
            "tag_score": round(tag_score, 4),
            "tag_weight": tag_weight,
            "tag_contrib": round(tag_score * tag_weight, 4),
        }
        if filter_reason:
            entry["status"] = f"FILTERED — {filter_reason}"
            entry["p_score"] = 0.0
            entry["combined"] = 0.0
            entry["final"] = 0.0
        else:
            entry["p_score"] = round(p_score, 4)
            entry["primary_contrib"] = round(p_score * 3.0, 4)
            entry["combined"] = round(combined, 4)
            entry["final"] = round(final, 4)
            entry["status"] = "PASS"
        log_entries.append(entry)

    results.sort(key=lambda x: (x[3], x[2]), reverse=True)
    final_results = [(p, u, score) for p, u, score, _ in results[:limit]]

    # --- Write log file ---
    try:
        log_dir = os.path.join(os.path.dirname(__file__), "..", "logs")
        os.makedirs(log_dir, exist_ok=True)
        log_path = os.path.join(log_dir, "shiro_scoring.log")

        # Sort entries: PASS first (by final desc), then FILTERED
        pass_entries = sorted([e for e in log_entries if e["status"] == "PASS"], key=lambda x: x["final"], reverse=True)
        filtered_entries = [e for e in log_entries if e["status"] != "PASS"]

        with open(log_path, "a", encoding="utf-8") as f:
            sep = "=" * 70
            f.write(f"\n{sep}\n")
            f.write(f"[{_dt.now().strftime('%Y-%m-%d %H:%M:%S')}] SHIRO SCORING REPORT\n")
            f.write(f"{sep}\n")
            f.write(f"PROMPT       : {prompt!r}\n")
            f.write(f"PRIMARY TAGS : {primary_tags}\n")
            f.write(f"DANBOORU TAGS: {danbooru_tags}\n")
            f.write(f"HIGH_CONF    : {high_confidence}  |  STRICT: {strict}\n")
            f.write(f"WEIGHTS      : sem={sem_weight}  tag={tag_weight}  primary_boost=×3.0\n")
            f.write(f"CANDIDATES   : {len(log_entries)} fetched → {len(pass_entries)} passed, {len(filtered_entries)} filtered\n")

            f.write(f"\n{'─'*70}\n")
            f.write(f"  PASSED ({len(pass_entries)} products, sorted by final score)\n")
            f.write(f"{'─'*70}\n")
            for rank, e in enumerate(pass_entries, 1):
                f.write(f"\n  #{rank:02d}  {e['product_name']!r}  [{e['product_id'][:8]}...]\n")
                f.write(f"       Tags ({len(e['product_tags'])}): {e['product_tags'][:12]}")
                if len(e['product_tags']) > 12:
                    f.write(f" ... +{len(e['product_tags'])-12} more")
                f.write("\n")
                f.write(f"       sem  : {e['sem_score']:.4f} × {e['sem_weight']} = {e['sem_contrib']:.4f}\n")
                f.write(f"       tag  : {e['tag_score']:.4f} × {e['tag_weight']} = {e['tag_contrib']:.4f}\n")
                f.write(f"       pri  : {e['p_score']:.4f} × 3.0  = {e.get('primary_contrib', 0):.4f}\n")
                f.write(f"       ─────────────────────────────\n")
                f.write(f"       combined={e['combined']:.4f}  FINAL={e['final']:.4f}  ✓ PASS\n")

            if filtered_entries:
                f.write(f"\n{'─'*70}\n")
                f.write(f"  FILTERED ({len(filtered_entries)} products)\n")
                f.write(f"{'─'*70}\n")
                for e in filtered_entries:
                    f.write(f"  ✗  {e['product_name']!r}  [{e['product_id'][:8]}...]  →  {e['status']}\n")
                    f.write(f"     sem={e['sem_score']:.4f}  tag={e['tag_score']:.4f}\n")

            f.write(f"\n{sep}\n")

        print(f"[Shiro/log] Scoring report → {log_path}")
    except Exception as log_err:
        print(f"[Shiro/log] WARNING: could not write log: {log_err}")

    return final_results


@strawberry.type
class AiSearchResult:
    products: List[SuggestionProduct]
    step: str  # hybrid | vi | en | relaxed | notfound
    keyword_used: Optional[str]


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
    def search_products_by_ai(self, prompt: str) -> AiSearchResult:
        from sqlalchemy import or_

        def _run_query(params: ProductSearchQuery, db):
            q = (
                db.query(Product, Store, User)
                .join(Store, Product.store_id == Store.id)
                .join(User, Store.owner_id == User.id)
                .filter(Product.is_active == True)
            )
            if params.keyword:
                q = q.filter(Product.name.ilike(f"%{params.keyword}%"))
            if params.min_price is not None:
                q = q.filter(Product.price >= params.min_price)
            if params.max_price is not None:
                q = q.filter(Product.price <= params.max_price)
            if params.software_tags:
                q = q.filter(or_(*[Product.software_tags.contains([t]) for t in params.software_tags]))
            if params.format_tags:
                q = q.filter(or_(*[Product.format_tags.contains([t]) for t in params.format_tags]))
            return q.order_by(Product.created_at.desc()).limit(30).all()

        params_vi = extract_search_query(prompt)
        print(f"[Shiro/extract] primary={params_vi.primary_tags} danbooru={params_vi.danbooru_tags} high_confidence={params_vi.high_confidence}")

        # Step 1: Hybrid — strict mode (primary hard filter + danbooru strict scoring)
        mode = "strict" if params_vi.high_confidence else "normal"
        print(f"[Shiro/step1-hybrid] trying semantic+tag search (mode={mode}, primary={params_vi.primary_tags})...")
        with get_db() as db:
            hybrid_rows = _hybrid_search(
                prompt,
                params_vi.danbooru_tags,
                db,
                high_confidence=params_vi.high_confidence,
                primary_tags=params_vi.primary_tags or None,
            )
        if hybrid_rows:
            print(f"[Shiro/step1-hybrid] ✓ {len(hybrid_rows)} results")
            return AiSearchResult(
                products=[_build_suggestion(p, u) for p, u, _ in hybrid_rows],
                step="hybrid",
                keyword_used=params_vi.keyword,
            )

        # Step 1.5: Relaxed hybrid — bỏ strict/primary hard filter, vẫn dùng danbooru scoring
        # Tránh rơi xuống keyword search khi strict quá kenh
        print(f"[Shiro/step1.5-relaxed-hybrid] strict filtered everything, retrying relaxed...")
        with get_db() as db:
            relaxed_rows = _hybrid_search(
                prompt,
                params_vi.danbooru_tags,
                db,
                high_confidence=False,   # normal F1 scoring, no strict tag filter
                primary_tags=None,       # no hard primary filter, but primary boost still applies via p_score if passed separately
            )
        if relaxed_rows:
            print(f"[Shiro/step1.5-relaxed-hybrid] ✓ {len(relaxed_rows)} results")
            return AiSearchResult(
                products=[_build_suggestion(p, u) for p, u, _ in relaxed_rows],
                step="hybrid",
                keyword_used=params_vi.keyword,
            )

        # Step 2: Keyword Vietnamese
        print(f"[Shiro/step2-vi] keyword={params_vi.keyword!r}")
        with get_db() as db:
            rows = _run_query(params_vi, db)
        if rows:
            print(f"[Shiro/step2-vi] ✓ {len(rows)} results")
            return AiSearchResult(
                products=[_build_suggestion(p, u) for p, _s, u in rows],
                step="vi",
                keyword_used=params_vi.keyword,
            )

        # Step 3: Keyword English
        print(f"[Shiro/step3-en] translating...")
        if params_vi.keyword:
            en_keyword = translate_to_english(params_vi.keyword)
            params_en = ProductSearchQuery(
                keyword=en_keyword,
                min_price=params_vi.min_price,
                max_price=params_vi.max_price,
                software_tags=params_vi.software_tags,
                format_tags=params_vi.format_tags,
            )
            with get_db() as db:
                rows = _run_query(params_en, db)
            if rows:
                print(f"[Shiro/step3-en] ✓ {len(rows)} results")
                return AiSearchResult(
                    products=[_build_suggestion(p, u) for p, _s, u in rows],
                    step="en",
                    keyword_used=en_keyword,
                )

        # Step 4: Relax — drop keyword, keep price/tags
        print(f"[Shiro/step4-relax] relaxing filters...")
        params_relaxed = ProductSearchQuery(
            keyword=None,
            min_price=params_vi.min_price,
            max_price=params_vi.max_price,
            software_tags=params_vi.software_tags,
            format_tags=params_vi.format_tags,
        )
        with get_db() as db:
            rows = _run_query(params_relaxed, db)
        if rows:
            print(f"[Shiro/step4-relax] ✓ {len(rows)} results")
            return AiSearchResult(
                products=[_build_suggestion(p, u) for p, _s, u in rows],
                step="relaxed",
                keyword_used=None,
            )

        print(f"[Shiro/step5] notfound — bó tay")
        return AiSearchResult(products=[], step="notfound", keyword_used=None)

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
