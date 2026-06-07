from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_current_user_optional, get_db
from app.crud.comments import create_comment, get_comment
from app.crud.reviews import create_review, recalc_store_rating, user_can_review_product
from app.models import Comment, OrderItem, Product, Review, User
from app.schemas.comment import CommentCreate, CommentRead
from app.schemas.review import ReviewCreate, ReviewRead


router = APIRouter()


def _anonymous_user(db: Session) -> User:
    user = db.scalar(select(User).where(User.email == "guest@tmdt.local"))
    if user is None:
        user = User(email="guest@tmdt.local", password_hash=None, full_name="Guest Client", is_verified=True)
        db.add(user)
        db.flush()
    return user


@router.post("/reviews", response_model=ReviewRead, status_code=status.HTTP_201_CREATED)
def submit_review(payload: ReviewCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> ReviewRead:
    existing = db.scalar(select(Review).where(Review.order_item_id == payload.order_item_id))
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Review already exists for this order item")

    if not user_can_review_product(db, current_user.id, payload.product_id, payload.order_item_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You can only review completed purchases")

    order_item = db.get(OrderItem, payload.order_item_id)
    if order_item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order item not found")

    review = create_review(
        db,
        user_id=current_user.id,
        product_id=payload.product_id,
        order_item_id=payload.order_item_id,
        rating=payload.rating,
        comment=payload.comment,
    )
    product = db.get(Product, payload.product_id)
    if product is not None:
        recalc_store_rating(db, product.store_id)

    db.commit()
    db.refresh(review)
    return ReviewRead.model_validate(review)


@router.post("/products/{product_id}/comments", response_model=CommentRead, status_code=status.HTTP_201_CREATED)
def ask_question(product_id: UUID, payload: CommentCreate, db: Session = Depends(get_db), current_user: User | None = Depends(get_current_user_optional)) -> CommentRead:
    product = db.get(Product, product_id)
    if product is None or not product.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    author = current_user or _anonymous_user(db)
    comment = create_comment(db, user_id=author.id, product_id=product_id, parent_id=None, content=payload.content)
    db.commit()
    db.refresh(comment)
    return CommentRead.model_validate(comment)


@router.post("/comments/{parent_id}/reply", response_model=CommentRead, status_code=status.HTTP_201_CREATED)
def reply_to_comment(parent_id: UUID, payload: CommentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> CommentRead:
    parent = get_comment(db, parent_id)
    if parent is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

    reply = create_comment(db, user_id=current_user.id, product_id=parent.product_id, parent_id=parent.id, content=payload.content)
    db.commit()
    db.refresh(reply)
    return CommentRead.model_validate(reply)
