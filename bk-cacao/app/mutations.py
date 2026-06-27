import strawberry

from app.agent import ask_agent
from app.database import get_db
from app.recommendation import (
    index_product_full,
    rebuild_all_product_profiles,
    track_event as _track_event,
)


@strawberry.type
class Mutation:
    @strawberry.mutation
    def ask_ai(self, prompt: str) -> str:
        return ask_agent(prompt)

    @strawberry.mutation
    def track_event(self, user_id: str, product_id: str, event_type: str) -> bool:
        """event_type: view | cart | search | follow | purchase"""
        with get_db() as db:
            return _track_event(db, user_id, product_id, event_type)

    @strawberry.mutation
    def index_product(self, product_id: str) -> bool:
        """Build tag_vector + embedding for a product. Called by bk-tmdt after product creation."""
        with get_db() as db:
            return index_product_full(db, product_id)

    @strawberry.mutation
    def rebuild_product_profiles(self) -> int:
        """Recompute tag vectors for all active products. Returns count."""
        with get_db() as db:
            return rebuild_all_product_profiles(db)
