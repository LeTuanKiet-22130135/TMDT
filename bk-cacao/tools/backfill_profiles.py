"""
Backfill recommendation profiles for products missing from product_red_profile.

Usage:
    uv run python tools/backfill_profiles.py
    uv run python tools/backfill_profiles.py --batch-size 20
    uv run python tools/backfill_profiles.py --dry-run
    uv run python tools/backfill_profiles.py --rebuild-all   # re-embed ALL active products
"""

from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

# Ensure project root is on path when run from anywhere
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import text
from app.database import engine, SessionLocal
from app.models import Base, Product, ProductRedProfile, EMBEDDING_DIM
from app.recommendation import index_product_full


def _ensure_extension_and_tables() -> None:
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        conn.commit()
    ProductRedProfile.__table__.create(engine, checkfirst=True)
    # Add embedding column if table already existed without it
    with engine.connect() as conn:
        conn.execute(text(
            f"ALTER TABLE product_red_profile "
            f"ADD COLUMN IF NOT EXISTS embedding vector({EMBEDDING_DIM})"
        ))
        conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_product_red_profile_embedding_hnsw "
            "ON product_red_profile USING hnsw (embedding vector_cosine_ops)"
        ))
        conn.commit()


def _find_missing(db) -> list[str]:
    """Return product_ids that have no entry in product_red_profile."""
    indexed_ids = {
        str(row[0])
        for row in db.query(ProductRedProfile.product_id).all()
    }
    all_ids = [
        str(row[0])
        for row in db.query(Product.id).filter(Product.is_active == True).all()
    ]
    return [pid for pid in all_ids if pid not in indexed_ids]


def _find_all_active(db) -> list[str]:
    return [
        str(row[0])
        for row in db.query(Product.id).filter(Product.is_active == True).all()
    ]


def run(batch_size: int, dry_run: bool, rebuild_all: bool) -> None:
    _ensure_extension_and_tables()

    with SessionLocal() as db:
        if rebuild_all:
            targets = _find_all_active(db)
            label = "rebuild-all"
        else:
            targets = _find_missing(db)
            label = "backfill-missing"

    total = len(targets)
    print(f"[{label}] {total} products to process (dry_run={dry_run})")

    if dry_run or total == 0:
        return

    ok = fail = 0
    for i in range(0, total, batch_size):
        batch = targets[i : i + batch_size]
        for pid in batch:
            with SessionLocal() as db:
                try:
                    success = index_product_full(db, pid)
                    if success:
                        ok += 1
                    else:
                        fail += 1
                        print(f"  [SKIP] {pid} — product not found in DB")
                except Exception as e:
                    fail += 1
                    print(f"  [FAIL] {pid}: {e}")

        done = min(i + batch_size, total)
        print(f"  {done}/{total} — ok={ok} fail={fail}")

    print(f"\nDone. ok={ok} fail={fail}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Backfill product_red_profile")
    parser.add_argument("--batch-size", type=int, default=10, metavar="N")
    parser.add_argument("--dry-run", action="store_true", help="Only count, do not process")
    parser.add_argument("--rebuild-all", action="store_true", help="Re-index all active products, not just missing ones")
    args = parser.parse_args()

    run(args.batch_size, args.dry_run, args.rebuild_all)
