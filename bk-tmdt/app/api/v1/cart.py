from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_db
from app.crud.cart import add_or_increment_cart_item, clear_cart, delete_cart_item, get_or_create_cart, list_cart_items, update_cart_item_quantity
from app.models import CartItem, Product, ShoppingCart, User
from app.schemas.cart import CartItemAddRequest, CartItemRead, CartItemUpdateRequest, CartProductRead, CartRead


router = APIRouter()


def _serialize_cart_item(item: CartItem, product: Product) -> CartItemRead:
    unit_price = Decimal(str(product.price))
    line_total = unit_price * item.quantity
    return CartItemRead(
        product_id=item.product_id,
        quantity=item.quantity,
        unit_price=unit_price,
        line_total=line_total,
        product=CartProductRead(
            id=product.id,
            name=product.name,
            price=unit_price,
            store_id=product.store_id,
            image_urls=product.image_urls,
        ),
    )


@router.get("/", response_model=CartRead)
def get_cart(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> CartRead:
    cart = get_or_create_cart(db, current_user.id)
    items = list_cart_items(db, cart.id)
    product_ids = [item.product_id for item in items]
    products = {product.id: product for product in db.scalars(select(Product).where(Product.id.in_(product_ids), Product.is_active.is_(True))).all()}

    serialized_items: list[CartItemRead] = []
    total_amount = Decimal("0.00")
    for item in items:
        product = products.get(item.product_id)
        if product is None:
            continue
        serialized_item = _serialize_cart_item(item, product)
        serialized_items.append(serialized_item)
        total_amount += serialized_item.line_total

    return CartRead(items=serialized_items, total_amount=total_amount.quantize(Decimal("0.01")))


@router.post("/items", response_model=CartItemRead, status_code=status.HTTP_201_CREATED)
def add_to_cart(payload: CartItemAddRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> CartItemRead:
    product = db.get(Product, payload.product_id)
    if product is None or not product.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    cart = get_or_create_cart(db, current_user.id)
    item = add_or_increment_cart_item(db, cart.id, payload.product_id, payload.quantity)
    db.commit()
    db.refresh(item)
    return _serialize_cart_item(item, product)


@router.put("/items/{product_id}", response_model=CartItemRead)
def update_cart_item(product_id: UUID, payload: CartItemUpdateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> CartItemRead:
    cart = get_or_create_cart(db, current_user.id)
    product = db.get(Product, product_id)
    if product is None or not product.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    item = update_cart_item_quantity(db, cart.id, product_id, payload.quantity)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")

    db.commit()
    db.refresh(item)
    return _serialize_cart_item(item, product)


@router.delete("/items/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_cart_item(product_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> None:
    cart = get_or_create_cart(db, current_user.id)
    delete_cart_item(db, cart.id, product_id)
    db.commit()
