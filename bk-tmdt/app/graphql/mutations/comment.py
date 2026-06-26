import strawberry
from uuid import UUID
from sqlalchemy import select
from strawberry.types import Info
from app.models import Comment, Product
from app.graphql.mutations.utils import _db, require_auth

@strawberry.type
class CommentMutation:
    @strawberry.mutation
    def add_comment(self, info: Info, product_id: UUID, content: str, parent_id: UUID | None = None) -> str:
        user = require_auth(info)
        db = _db(info)
        
        product = db.get(Product, product_id)
        if not product or not product.is_active:
            raise Exception("Product not found or inactive")
            
        if parent_id:
            parent_comment = db.get(Comment, parent_id)
            if not parent_comment or parent_comment.product_id != product_id:
                raise Exception("Invalid parent comment")
                
        if not content.strip():
            raise Exception("Comment content cannot be empty")
            
        new_comment = Comment(
            user_id=user.id,
            product_id=product_id,
            parent_id=parent_id,
            content=content.strip()
        )
        db.add(new_comment)
        db.commit()
        return "Comment added successfully"
