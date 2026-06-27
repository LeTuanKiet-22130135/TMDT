import strawberry
from sqlalchemy import select
from strawberry.types import Info

from app.graphql.context import get_graphql_context  # noqa: F401 (keeps imports consistent)
from app.models import User, UserFollow


def _db(info: Info):
    return info.context["db"]


def _current_user(info: Info):
    return info.context.get("current_user")


@strawberry.type
class FollowMutation:
    @strawberry.mutation
    def follow_author(self, info: Info, shortlink: str) -> bool:
        user = _current_user(info)
        if user is None:
            raise Exception("Not authenticated")
        db = _db(info)
        author = db.scalar(select(User).where(User.shortlink == shortlink, User.is_active == True))
        if author is None:
            raise Exception("Author not found")
        if author.id == user.id:
            raise Exception("Cannot follow yourself")
        exists = db.scalar(
            select(UserFollow).where(
                UserFollow.follower_id == user.id,
                UserFollow.followed_id == author.id,
            )
        )
        if exists:
            return True
        db.add(UserFollow(follower_id=user.id, followed_id=author.id))
        db.commit()
        return True

    @strawberry.mutation
    def unfollow_author(self, info: Info, shortlink: str) -> bool:
        user = _current_user(info)
        if user is None:
            raise Exception("Not authenticated")
        db = _db(info)
        author = db.scalar(select(User).where(User.shortlink == shortlink, User.is_active == True))
        if author is None:
            return False
        row = db.scalar(
            select(UserFollow).where(
                UserFollow.follower_id == user.id,
                UserFollow.followed_id == author.id,
            )
        )
        if row:
            db.delete(row)
            db.commit()
        return True
