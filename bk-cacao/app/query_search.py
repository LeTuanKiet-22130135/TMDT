import os
from datetime import datetime as _dt
from typing import List, Optional

from sqlalchemy import or_

from app.agent import extract_search_query, translate_to_english, ProductSearchQuery
from app.database import get_db
from app.gql_types import AiSearchResult, SuggestionProduct, _build_suggestion
from app.models import Product, Store, User
from app.scoring import _hybrid_search

_LOG_DIR = os.path.join(os.path.dirname(__file__), "..", "logs")
_SEARCH_LOG = os.path.join(_LOG_DIR, "shiro_search.log")
_SEP = "=" * 70
_DASH = "─" * 70


def _slog(msg: str = ""):
    try:
        os.makedirs(_LOG_DIR, exist_ok=True)
        with open(_SEARCH_LOG, "a", encoding="utf-8") as f:
            f.write(msg + "\n")
    except Exception as e:
        print(f"[Shiro/log] search log error: {e}")


def _log_hybrid_products(label: str, rows: list):
    _slog(f"\n    {label} ({len(rows)}):")
    for i, (p, u, score) in enumerate(rows[:20], 1):
        all_tags = list(p.user_tags or []) + list(p.ai_tags or [])
        _slog(f"      #{i:02d} [score={score:.4f}]  {p.name!r}")
        _slog(f"           id={p.id}")
        _slog(f"           price={p.price}  license={p.license_type or '-'}")
        _slog(f"           author={u.full_name!r}  shortlink={u.shortlink or '-'}")
        _slog(f"           software={list(p.software_tags or [])}")
        _slog(f"           format={list(p.format_tags or [])}")
        _slog(f"           tags ({len(all_tags)}): {all_tags[:15]}{' ...' if len(all_tags) > 15 else ''}")


def _log_keyword_products(label: str, rows: list):
    _slog(f"\n    {label} ({len(rows)}):")
    for i, (p, _s, u) in enumerate(rows[:20], 1):
        all_tags = list(p.user_tags or []) + list(p.ai_tags or [])
        _slog(f"      #{i:02d}  {p.name!r}")
        _slog(f"           id={p.id}")
        _slog(f"           price={p.price}  license={p.license_type or '-'}")
        _slog(f"           author={u.full_name!r}  shortlink={u.shortlink or '-'}")
        _slog(f"           software={list(p.software_tags or [])}")
        _slog(f"           format={list(p.format_tags or [])}")
        _slog(f"           tags ({len(all_tags)}): {all_tags[:15]}{' ...' if len(all_tags) > 15 else ''}")


def _apply_hard_filters(rows: list, params: ProductSearchQuery) -> list:
    """Post-filter hybrid results by price, software_tags, format_tags."""
    result = []
    for p, u, score in rows:
        if params.min_price is not None and p.price < params.min_price:
            continue
        if params.max_price is not None and p.price > params.max_price:
            continue
        if params.software_tags:
            p_sw = list(p.software_tags or [])
            if not any(t in p_sw for t in params.software_tags):
                continue
        if params.format_tags:
            p_fmt = list(p.format_tags or [])
            if not any(t in p_fmt for t in params.format_tags):
                continue
        result.append((p, u, score))
    return result


def _run_keyword_query(params: ProductSearchQuery, db):
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


def search_products_by_ai(prompt: str) -> AiSearchResult:
    # --- Session header ---
    _slog(f"\n{_SEP}")
    _slog(f"[{_dt.now().strftime('%Y-%m-%d %H:%M:%S')}] SHIRO SEARCH SESSION")
    _slog(_SEP)
    _slog(f"PROMPT: {prompt!r}")

    params_vi = extract_search_query(prompt)
    print(f"[Shiro/extract] primary={params_vi.primary_tags} danbooru={params_vi.danbooru_tags} high_confidence={params_vi.high_confidence}")
    _slog(f"EXTRACTED PARAMS:")
    _slog(f"  keyword      : {params_vi.keyword!r}")
    _slog(f"  primary_tags : {params_vi.primary_tags}")
    _slog(f"  danbooru_tags: {params_vi.danbooru_tags}")
    _slog(f"  high_conf    : {params_vi.high_confidence}")
    _slog(f"  price_range  : {params_vi.min_price} – {params_vi.max_price}")
    _slog(f"  software_tags: {params_vi.software_tags}")
    _slog(f"  format_tags  : {params_vi.format_tags}")
    _slog(_DASH)

    # Step 1: Hybrid VI strict
    mode = "strict" if params_vi.high_confidence else "normal"
    _slog(f"\n[Step 1] Hybrid VI  mode={mode}  primary={params_vi.primary_tags}")
    print(f"[Shiro/step1-hybrid] trying semantic+tag search (mode={mode}, primary={params_vi.primary_tags})...")
    with get_db() as db:
        hybrid_rows = _hybrid_search(
            prompt,
            params_vi.danbooru_tags,
            db,
            high_confidence=params_vi.high_confidence,
            primary_tags=params_vi.primary_tags or None,
        )
    hybrid_rows = _apply_hard_filters(hybrid_rows, params_vi)
    if hybrid_rows:
        print(f"[Shiro/step1-hybrid] ✓ {len(hybrid_rows)} results (after price/tag filter)")
        _slog(f"  → HIT ✓  (scoring detail → shiro_scoring.log)")
        _log_hybrid_products("Returned", hybrid_rows)
        _slog(f"\n[RESULT] step=hybrid  via=step1  count={len(hybrid_rows)}")
        _slog(_SEP)
        return AiSearchResult(
            products=[_build_suggestion(p, u) for p, u, _ in hybrid_rows],
            step="hybrid",
            keyword_used=params_vi.keyword,
        )
    _slog(f"  → MISS (0 after scoring/filter)")

    # Step 1.5: Hybrid VI relaxed
    _slog(f"\n[Step 1.5] Hybrid VI relaxed  (no strict, keep primary boost for ranking)")
    print(f"[Shiro/step1.5-relaxed-hybrid] strict filtered everything, retrying relaxed...")
    with get_db() as db:
        relaxed_rows = _hybrid_search(
            prompt,
            params_vi.danbooru_tags,
            db,
            high_confidence=False,
            primary_tags=params_vi.primary_tags or None,
        )
    relaxed_rows = _apply_hard_filters(relaxed_rows, params_vi)
    if relaxed_rows:
        print(f"[Shiro/step1.5-relaxed-hybrid] ✓ {len(relaxed_rows)} results (after price/tag filter)")
        _slog(f"  → HIT ✓  (scoring detail → shiro_scoring.log)")
        _log_hybrid_products("Returned", relaxed_rows)
        _slog(f"\n[RESULT] step=hybrid  via=step1.5  count={len(relaxed_rows)}")
        _slog(_SEP)
        return AiSearchResult(
            products=[_build_suggestion(p, u) for p, u, _ in relaxed_rows],
            step="hybrid",
            keyword_used=params_vi.keyword,
        )
    _slog(f"  → MISS")

    # Step 2: Hybrid EN
    _slog(f"\n[Step 2] Hybrid EN  (translate prompt → English)")
    print(f"[Shiro/step2-hybrid-en] translating prompt to English, retrying hybrid...")
    en_prompt = translate_to_english(prompt)
    _slog(f"  en_prompt: {en_prompt!r}")
    with get_db() as db:
        hybrid_en_rows = _hybrid_search(
            en_prompt,
            params_vi.danbooru_tags,
            db,
            high_confidence=False,
            primary_tags=params_vi.primary_tags or None,
        )
    hybrid_en_rows = _apply_hard_filters(hybrid_en_rows, params_vi)
    if hybrid_en_rows:
        print(f"[Shiro/step2-hybrid-en] ✓ {len(hybrid_en_rows)} results (after price/tag filter)")
        _slog(f"  → HIT ✓  (scoring detail → shiro_scoring.log)")
        _log_hybrid_products("Returned", hybrid_en_rows)
        _slog(f"\n[RESULT] step=hybrid  via=step2-EN  count={len(hybrid_en_rows)}")
        _slog(_SEP)
        return AiSearchResult(
            products=[_build_suggestion(p, u) for p, u, _ in hybrid_en_rows],
            step="hybrid",
            keyword_used=params_vi.keyword,
        )
    _slog(f"  → MISS")

    # Step 3: Keyword VI
    _slog(f"\n[Step 3] Keyword VI  keyword={params_vi.keyword!r}")
    print(f"[Shiro/step3-vi] keyword={params_vi.keyword!r}")
    with get_db() as db:
        rows = _run_keyword_query(params_vi, db)
    if rows:
        print(f"[Shiro/step3-vi] ✓ {len(rows)} results")
        _slog(f"  → HIT ✓")
        _log_keyword_products("Returned", rows)
        _slog(f"\n[RESULT] step=vi  via=step3  count={len(rows)}")
        _slog(_SEP)
        return AiSearchResult(
            products=[_build_suggestion(p, u) for p, _s, u in rows],
            step="vi",
            keyword_used=params_vi.keyword,
        )
    _slog(f"  → MISS")

    # Step 4: Keyword EN
    _slog(f"\n[Step 4] Keyword EN")
    print(f"[Shiro/step4-en] keyword search with English translation...")
    if params_vi.keyword:
        en_keyword = translate_to_english(params_vi.keyword)
        _slog(f"  en_keyword: {en_keyword!r}")
        params_en = ProductSearchQuery(
            keyword=en_keyword,
            min_price=params_vi.min_price,
            max_price=params_vi.max_price,
            software_tags=params_vi.software_tags,
            format_tags=params_vi.format_tags,
        )
        with get_db() as db:
            rows = _run_keyword_query(params_en, db)
        if rows:
            print(f"[Shiro/step4-en] ✓ {len(rows)} results")
            _slog(f"  → HIT ✓")
            _log_keyword_products("Returned", rows)
            _slog(f"\n[RESULT] step=en  via=step4  count={len(rows)}")
            _slog(_SEP)
            return AiSearchResult(
                products=[_build_suggestion(p, u) for p, _s, u in rows],
                step="en",
                keyword_used=en_keyword,
            )
        _slog(f"  → MISS")
    else:
        _slog(f"  SKIP (no keyword to translate)")

    # Step 5: Relax
    _slog(f"\n[Step 5] Relax  (no keyword, price/tags only)")
    print(f"[Shiro/step5-relax] relaxing filters...")
    params_relaxed = ProductSearchQuery(
        keyword=None,
        min_price=params_vi.min_price,
        max_price=params_vi.max_price,
        software_tags=params_vi.software_tags,
        format_tags=params_vi.format_tags,
    )
    with get_db() as db:
        rows = _run_keyword_query(params_relaxed, db)
    if rows:
        print(f"[Shiro/step5-relax] ✓ {len(rows)} results")
        _slog(f"  → HIT ✓")
        _log_keyword_products("Returned", rows)
        _slog(f"\n[RESULT] step=relaxed  via=step5  count={len(rows)}")
        _slog(_SEP)
        return AiSearchResult(
            products=[_build_suggestion(p, u) for p, _s, u in rows],
            step="relaxed",
            keyword_used=None,
        )
    _slog(f"  → MISS")

    print(f"[Shiro/step6] notfound — bó tay")
    _slog(f"\n[RESULT] step=notfound  via=step6")
    _slog(_SEP)
    return AiSearchResult(products=[], step="notfound", keyword_used=None)
