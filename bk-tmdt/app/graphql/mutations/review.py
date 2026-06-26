import strawberry
from uuid import UUID
from sqlalchemy import select
from strawberry.types import Info
from app.models import Review, Product, Order, OrderItem, OrderStatusEnum
from app.graphql.mutations.utils import _db, require_auth

@strawberry.type
class ReviewMutation:
    @strawberry.mutation
    def add_review(self, info: Info, product_id: UUID, rating: int, comment: str) -> str:
        user = require_auth(info)
        db = _db(info)
        
        # Check if the user has purchased the product
        stmt = (
            select(OrderItem)
            .join(Order, OrderItem.order_id == Order.id)
            .where(
                Order.user_id == user.id,
                OrderItem.product_id == product_id,
                Order.status.in_([OrderStatusEnum.PAID, OrderStatusEnum.COMPLETED])
            )
            .limit(1)
        )
        order_item = db.scalar(stmt)
        if not order_item:
            raise Exception("You can only review products you have purchased.")
            
        # Check if already reviewed for this order item
        existing_review = db.scalar(select(Review).where(Review.order_item_id == order_item.id))
        if existing_review:
            raise Exception("You have already reviewed this product.")
            
        if rating < 1 or rating > 5:
            raise Exception("Rating must be between 1 and 5.")
            
        new_review = Review(
            user_id=user.id,
            product_id=product_id,
            order_item_id=order_item.id,
            rating=rating,
            comment=comment
        )
        db.add(new_review)
        db.commit()
        return "Review added successfully"
