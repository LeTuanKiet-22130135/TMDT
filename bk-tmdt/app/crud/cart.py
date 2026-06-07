from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models import CartItem, Product, ShoppingCart


def get_or_create_cart(db: Session, user_id) -> ShoppingCart:
    cart = db.scalar(select(ShoppingCart).where(ShoppingCart.user_id == user_id))
    if cart is None:
        cart = ShoppingCart(user_id=user_id)
        db.add(cart)
        db.flush()
    return cart


def get_cart_item(db: Session, cart_id, product_id) -> CartItem | None:
    return db.scalar(select(CartItem).where(CartItem.cart_id == cart_id, CartItem.product_id == product_id))


def list_cart_items(db: Session, cart_id) -> list[CartItem]:
    return list(db.scalars(select(CartItem).where(CartItem.cart_id == cart_id)).all())


def add_or_increment_cart_item(db: Session, cart_id, product_id, quantity: int) -> CartItem:
    item = get_cart_item(db, cart_id, product_id)
    if item is None:
        item = CartItem(cart_id=cart_id, product_id=product_id, quantity=quantity)
        db.add(item)
    else:
        item.quantity += quantity
    db.flush()
    return item


def update_cart_item_quantity(db: Session, cart_id, product_id, quantity: int) -> CartItem | None:
    item = get_cart_item(db, cart_id, product_id)
    if item is None:
        return None
    item.quantity = quantity
    db.flush()
    return item


def delete_cart_item(db: Session, cart_id, product_id) -> None:
    db.execute(delete(CartItem).where(CartItem.cart_id == cart_id, CartItem.product_id == product_id))


def clear_cart(db: Session, cart_id) -> None:
    db.execute(delete(CartItem).where(CartItem.cart_id == cart_id))


def get_cart_products_for_items(db: Session, product_ids: list) -> list[Product]:
    return list(db.scalars(select(Product).where(Product.id.in_(product_ids))).all())
