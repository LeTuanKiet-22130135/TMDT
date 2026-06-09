from collections import defaultdict
from decimal import Decimal, ROUND_HALF_UP
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_db
from app.crud.cart import clear_cart, get_or_create_cart, list_cart_items
from app.crud.orders import create_order, create_order_item, get_order, get_order_by_id_for_store, list_user_orders, to_decimal
from app.crud.payments import create_payment
from app.crud.stores import get_store_by_owner
from app.core.config import settings
from app.models import CartItem, Order, OrderItem, OrderStatusEnum, PaymentMethodEnum, PaymentStatusEnum, Product, RoleEnum, Store, User
from app.schemas.order import CheckoutRequest, CheckoutResponse, OrderItemRead, OrderRead, OrderStatusUpdateRequest
from app.services.rewards import points_from_amount, points_to_discount


router = APIRouter()


def _serialize_order_item(item: OrderItem) -> OrderItemRead:
    return OrderItemRead(
        id=item.id,
        product_id=item.product_id,
        unit_price=item.unit_price,
        quantity=item.quantity,
        product=None,
    )


def _serialize_order(order: Order) -> OrderRead:
    return OrderRead(
        id=order.id,
        user_id=order.user_id,
        store_id=order.store_id,
        total_amount=order.total_amount,
        points_used=order.points_used,
        discount_amount=order.discount_amount,
        final_amount=order.final_amount,
        status=order.status,
        shipping_address=order.shipping_address,
        items=[_serialize_order_item(item) for item in order.items],
    )


@router.post("/checkout", response_model=CheckoutResponse, status_code=status.HTTP_201_CREATED)
def checkout(payload: CheckoutRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> CheckoutResponse:
    cart = get_or_create_cart(db, current_user.id)
    cart_items = list_cart_items(db, cart.id)
    if not cart_items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty")

    product_ids = [item.product_id for item in cart_items]
    products = list(db.scalars(select(Product).where(Product.id.in_(product_ids)).with_for_update()).all())
    product_map = {product.id: product for product in products}

    grouped_items: dict[UUID, list[tuple[Product, CartItem]]] = defaultdict(list)
    total_amount = Decimal("0.00")
    for cart_item in cart_items:
        product = product_map.get(cart_item.product_id)
        if product is None or not product.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        if product.stock_quantity < cart_item.quantity:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Insufficient stock for {product.name}")
        grouped_items[product.store_id].append((product, cart_item))
        total_amount += Decimal(str(product.price)) * cart_item.quantity

    requested_points = payload.use_points or 0
    if requested_points > current_user.reward_points:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient reward points")

    if requested_points > 0 and Decimal(requested_points * settings.reward_point_value_vnd) > total_amount:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Points exceed checkout total")

    discount_amount = points_to_discount(requested_points)
    final_amount = to_decimal(total_amount - discount_amount)

    orders: list[Order] = []
    payment_transaction_ids: list[str] = []
    total_discount_applied = Decimal("0.00")
    remaining_points = requested_points
    store_ids = list(grouped_items.keys())

    for index, store_id in enumerate(store_ids):
        items_for_store = grouped_items[store_id]
        store_subtotal = sum((Decimal(str(product.price)) * cart_item.quantity for product, cart_item in items_for_store), Decimal("0.00"))
        if index == len(store_ids) - 1:
            order_points = remaining_points
        else:
            ratio = (store_subtotal / total_amount) if total_amount > 0 else Decimal("0")
            order_points = int((Decimal(requested_points) * ratio).to_integral_value(rounding=ROUND_HALF_UP))
            order_points = min(order_points, remaining_points)
            remaining_points -= order_points

        order_discount = to_decimal(points_to_discount(order_points))
        total_discount_applied += order_discount

        order = create_order(
            db,
            user_id=current_user.id,
            store_id=store_id,
            total_amount=to_decimal(store_subtotal),
            points_used=order_points,
            discount_amount=to_decimal(order_discount),
            final_amount=to_decimal(store_subtotal - order_discount),
            status=OrderStatusEnum.PENDING,
            shipping_address=payload.shipping_address,
        )
        orders.append(order)

        for product, cart_item in items_for_store:
            create_order_item(
                db,
                order_id=order.id,
                product_id=product.id,
                unit_price=Decimal(str(product.price)),
                quantity=cart_item.quantity,
            )
            product.stock_quantity -= cart_item.quantity
            product.sold_quantity += cart_item.quantity

        transaction_id = str(uuid4()) if payload.payment_method != PaymentMethodEnum.COD else None
        payment = create_payment(
            db,
            order_id=order.id,
            method=payload.payment_method,
            status=PaymentStatusEnum.UNPAID,
            transaction_id=transaction_id,
        )
        db.add(payment)
        if payment.transaction_id is not None:
            payment_transaction_ids.append(payment.transaction_id)

    if requested_points > 0:
        current_user.reward_points -= requested_points

    clear_cart(db, cart.id)
    db.add(current_user)
    db.commit()

    refreshed_orders = [db.get(Order, order.id) for order in orders]
    return CheckoutResponse(
        orders=[_serialize_order(order) for order in refreshed_orders if order is not None],
        total_amount=to_decimal(total_amount),
        points_used=requested_points,
        discount_amount=to_decimal(total_discount_applied),
        final_amount=to_decimal(final_amount),
        payment_transaction_ids=payment_transaction_ids,
    )


@router.get("/history", response_model=list[OrderRead])
def order_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[OrderRead]:
    return [_serialize_order(order) for order in list_user_orders(db, current_user.id)]


@router.put("/{order_id}/status", response_model=OrderRead)
def update_order_status(order_id: UUID, payload: OrderStatusUpdateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> OrderRead:
    order = db.get(Order, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if current_user.role == RoleEnum.BUYER:
        if payload.status != OrderStatusEnum.CANCELLED or order.user_id != current_user.id or order.status != OrderStatusEnum.PENDING:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Buyer can only cancel pending orders")
        _restore_order_stock(db, order)
        _refund_points(db, order, current_user)
        order.status = OrderStatusEnum.CANCELLED
    elif current_user.role == RoleEnum.SELLER:
        seller_store = get_store_by_owner(db, current_user.id)
        if seller_store is None or order.store_id != seller_store.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Order not accessible")
        allowed_transitions = {
            OrderStatusEnum.PENDING: {OrderStatusEnum.PROCESSING},
            OrderStatusEnum.PROCESSING: {OrderStatusEnum.SHIPPED},
        }
        if payload.status not in allowed_transitions.get(order.status, set()):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid seller status transition")
        order.status = payload.status
    else:
        if order.status != OrderStatusEnum.SHIPPED or payload.status != OrderStatusEnum.COMPLETED:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Admin can only complete shipped orders")
        order.status = OrderStatusEnum.COMPLETED
        _award_points(db, order)

    db.add(order)
    db.commit()
    db.refresh(order)
    return _serialize_order(order)


@router.post("/{order_id}/cancel", response_model=OrderRead)
def cancel_order(order_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> OrderRead:
    order = db.get(Order, order_id)
    if order is None or order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.status != OrderStatusEnum.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only pending orders can be cancelled")

    _restore_order_stock(db, order)
    _refund_points(db, order, current_user)
    order.status = OrderStatusEnum.CANCELLED
    db.add(order)
    db.commit()
    db.refresh(order)
    return _serialize_order(order)


def _restore_order_stock(db: Session, order: Order) -> None:
    for item in order.items:
        product = db.get(Product, item.product_id)
        if product is not None:
            product.stock_quantity += item.quantity
            product.sold_quantity = max(0, product.sold_quantity - item.quantity)


def _refund_points(db: Session, order: Order, current_user: User) -> None:
    if order.points_used > 0:
        current_user.reward_points += order.points_used
        db.add(current_user)


def _award_points(db: Session, order: Order) -> None:
    user = db.get(User, order.user_id)
    if user is None:
        return
    user.reward_points += points_from_amount(order.final_amount)
    db.add(user)
