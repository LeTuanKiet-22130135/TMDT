import strawberry
from uuid import UUID
from sqlalchemy import select
from strawberry.types import Info

from app.models import Product, ProductLike


def _db(info: Info):
    return info.context["db"]


def _current_user(info: Info):
    return info.context.get("current_user")


@strawberry.type
class LikeMutation:
    @strawberry.mutation
    def like_product(self, info: Info, product_id: UUID) -> bool:
        user = _current_user(info)
        if user is None:
            raise Exception("Not authenticated")
        db = _db(info)
        product = db.get(Product, product_id)
        if product is None or not product.is_active:
            raise Exception("Product not found")
        exists = db.scalar(
            select(ProductLike).where(
                ProductLike.user_id == user.id,
                ProductLike.product_id == product_id,
            )
        )
        if exists:
            return True
        db.add(ProductLike(user_id=user.id, product_id=product_id))
        db.commit()
        return True

    @strawberry.mutation
    def unlike_product(self, info: Info, product_id: UUID) -> bool:
        user = _current_user(info)
        if user is None:
            raise Exception("Not authenticated")
        db = _db(info)
        row = db.scalar(
            select(ProductLike).where(
                ProductLike.user_id == user.id,
                ProductLike.product_id == product_id,
            )
        )
        if row:
            db.delete(row)
            db.commit()
        return True
