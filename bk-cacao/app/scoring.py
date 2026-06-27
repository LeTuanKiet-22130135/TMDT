from difflib import SequenceMatcher
from typing import List, Optional
from uuid import UUID

from app.gql_types import _fetch_products_by_ids
from app.recommendation import search_by_embedding


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
        return any(tw in pw or pw in tw for tw in tag_words for pw in pool)

    if strict:
        matched_tags = [ws for ws in q_tag_sets if _tag_matches(ws, p_words)]
        valid_count = len(matched_tags)
        if valid_count == 0:
            return 0.0
        coverage = sum(
            sum(1 for w in ws if any(w in pw or pw in w for pw in p_words)) / len(ws)
            for ws in matched_tags
        ) / valid_count
        match_ratio = valid_count / len(q_tag_sets)
        return min(coverage * match_ratio + 0.05 * min(valid_count / 5, 1.0), 1.0)

    else:
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
            p_words = set(np_tag.split())
            q_words = set(qt.split())
            if p_words and p_words.issubset(q_words):
                return True
            # danbooru prefix-style: "girl" matches "1girl", "2girls", etc.
            if np_tag in qt:
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

    log_entries: list[dict] = []
    results = []

    for pid, sem_score in candidates:
        if pid not in product_map:
            continue
        p, u = product_map[pid]
        all_tags = list(p.user_tags or []) + list(p.ai_tags or [])

        tag_score = _tag_fuzzy_score(danbooru_tags, all_tags, strict=strict) if danbooru_tags else 0.0

        filter_reason: Optional[str] = None

        if strict and tag_score < 0.02:
            filter_reason = f"strict_tag_filter (tag_score={tag_score:.3f} < 0.02)"
        else:
            p_score = _primary_tag_score(primary_tags, all_tags) if has_primary else 0.0
            combined = sem_weight * sem_score + tag_weight * tag_score
            final = combined + p_score * 3.0
            results.append((p, u, final, p_score))

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

    # --- Write scoring log ---
    try:
        log_dir = os.path.join(os.path.dirname(__file__), "..", "logs")
        os.makedirs(log_dir, exist_ok=True)
        log_path = os.path.join(log_dir, "shiro_scoring.log")

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
