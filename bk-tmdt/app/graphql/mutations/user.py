import strawberry
from strawberry.types import Info
from sqlalchemy import select
from typing import Optional
from datetime import datetime, timezone, timedelta

from app.models import User
from app.graphql.types import to_user_type, UserType
from app.graphql.mutations.utils import _db

@strawberry.type
class UserMutation:
    @strawberry.mutation
    def updateProfile(
        self,
        info: Info,
        full_name: Optional[str] = None,
        bio: Optional[str] = None,
        avatar_url: Optional[str] = None,
        banner_url: Optional[str] = None,
        specialties: Optional[list[str]] = None,
        website: Optional[str] = None,
        twitter: Optional[str] = None,
        instagram: Optional[str] = None,
    ) -> UserType:
        user = info.context.get("current_user")
        if user is None:
            raise Exception("Bạn chưa đăng nhập")

        db = _db(info)
        if full_name is not None:
            user.full_name = full_name.strip()
        if bio is not None:
            user.bio = bio
        if avatar_url is not None:
            user.avatar_url = avatar_url
        if banner_url is not None:
            user.banner_url = banner_url if banner_url != "" else None
        if specialties is not None:
            user.specialties = specialties

        social = dict(user.social_links or {})
        if website is not None:
            social["website"] = website
        if twitter is not None:
            social["twitter"] = twitter
        if instagram is not None:
            social["instagram"] = instagram
        user.social_links = social

        db.add(user)
        db.commit()
        db.refresh(user)
        return to_user_type(user)

    @strawberry.mutation
    def updateShortlink(self, info: Info, shortlink: str) -> UserType:
        user = info.context.get("current_user")
        if user is None:
            raise Exception("Bạn chưa đăng nhập")

        if user.shortlink_updated_at:
            next_allowed = user.shortlink_updated_at + timedelta(days=10)
            if datetime.now(timezone.utc) < next_allowed:
                remaining = (next_allowed - datetime.now(timezone.utc)).days + 1
                raise Exception(f"Bạn chỉ có thể đổi shortlink mỗi 10 ngày. Còn {remaining} ngày nữa.")

        sl = shortlink.strip().lower()
        if not sl:
            raise Exception("Shortlink không được để trống")
        if len(sl) > 32:
            raise Exception("Shortlink tối đa 32 ký tự")
        if not sl.replace('-', '').replace('_', '').isalnum():
            raise Exception("Shortlink chỉ được chứa chữ cái, số, dấu - hoặc _")

        db = _db(info)
        existing = db.scalar(select(User).where(User.shortlink == sl))
        if existing and existing.id != user.id:
            raise Exception("Shortlink này đã được sử dụng")

        user.shortlink = sl
        user.shortlink_updated_at = datetime.now(timezone.utc)
        db.add(user)
        db.commit()
        db.refresh(user)
        return to_user_type(user)
