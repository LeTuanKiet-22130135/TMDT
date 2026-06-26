"""
Reset a user account to fresh state.

Wipes:
  - All orders  (cascades → order_items, payments, reviews)
  - Cart items
  - reward_points → 0
  - user_red_profile  (bk-cacao recommendation profile, same DB)

For development/testing only. Irreversible.

Usage:
    uv run python tools/reset_user.py --email user@example.com
    uv run python tools/reset_user.py --email user@example.com --dry-run
    uv run python tools/reset_user.py --user-id <uuid>
    uv run python tools/reset_user.py --email user@example.com --yes   # skip confirm
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from uuid import UUID

sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import text
from app.db.session import SessionLocal
from app.models.entities import CartItem, Order, ShoppingCart, User


def _find_user(db, *, email: str | None, user_id: str | None) -> User | None:
    if email:
        return db.query(User).filter_by(email=email).first()
    if user_id:
        return db.query(User).filter_by(id=UUID(user_id)).first()
    return None


def _preview(db, user: User) -> dict:
    order_count = db.query(Order).filter_by(user_id=user.id).count()
    cart = db.query(ShoppingCart).filter_by(user_id=user.id).first()
    cart_count = db.query(CartItem).filter_by(cart_id=cart.id).count() if cart else 0
    has_red_profile = db.execute(
        text("SELECT 1 FROM user_red_profile WHERE user_id = :uid LIMIT 1"),
        {"uid": str(user.id)},
    ).fetchone() is not None
    return {
        "orders": order_count,
        "cart_items": cart_count,
        "reward_points": user.reward_points,
        "red_profile": has_red_profile,
    }


def _reset(db, user: User, dry_run: bool) -> None:
    preview = _preview(db, user)
    print(f"\nUser : {user.email}  ({user.id})")
    print(f"  orders to delete   : {preview['orders']}")
    print(f"  cart items to clear: {preview['cart_items']}")
    print(f"  reward_points      : {preview['reward_points']} → 0")
    print(f"  red_profile        : {'will delete' if preview['red_profile'] else 'none'}")

    if dry_run:
        print("\n[dry-run] No changes made.")
        return

    # Delete orders (CASCADE → order_items, payments, reviews)
    db.query(Order).filter_by(user_id=user.id).delete(synchronize_session=False)

    # Clear cart items
    cart = db.query(ShoppingCart).filter_by(user_id=user.id).first()
    if cart:
        db.query(CartItem).filter_by(cart_id=cart.id).delete(synchronize_session=False)

    # Reset reward points
    user.reward_points = 0

    # Delete recommendation profile
    db.execute(
        text("DELETE FROM user_red_profile WHERE user_id = :uid"),
        {"uid": str(user.id)},
    )

    db.commit()
    print("\nDone. Account reset to fresh state.")


def run(email: str | None, user_id: str | None, dry_run: bool, yes: bool) -> None:
    with SessionLocal() as db:
        user = _find_user(db, email=email, user_id=user_id)
        if not user:
            print(f"[ERROR] User not found: {email or user_id}")
            sys.exit(1)

        if not dry_run and not yes:
            preview = _preview(db, user)
            print(f"\nAbout to PERMANENTLY reset: {user.email}  ({user.id})")
            print(f"  - Delete {preview['orders']} order(s) and all related data")
            print(f"  - Clear {preview['cart_items']} cart item(s)")
            print(f"  - Reset reward_points from {preview['reward_points']} to 0")
            print(f"  - Delete recommendation profile: {preview['red_profile']}")
            confirm = input("\nType YES to confirm: ")
            if confirm.strip() != "YES":
                print("Aborted.")
                sys.exit(0)

        _reset(db, user, dry_run)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Reset user account to fresh state")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--email", help="User email")
    group.add_argument("--user-id", help="User UUID")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be deleted without doing it")
    parser.add_argument("--yes", action="store_true", help="Skip confirmation prompt")
    args = parser.parse_args()

    run(args.email, args.user_id, args.dry_run, args.yes)
