from decimal import Decimal

from app.api.dependencies import get_current_admin, get_current_seller, get_current_user, get_current_user_optional
from app.models import CartItem, Order, OrderItem, OrderStatusEnum, Payment, PaymentMethodEnum, PaymentStatusEnum, Product


def test_checkout_creates_order_payment_and_clears_cart(client, db_session, sample_data):
    app = client.app
    app.dependency_overrides[get_current_user] = lambda: sample_data["buyer"]

    db_session.add(CartItem(cart_id=sample_data["cart"].id, product_id=sample_data["product"].id, quantity=2))
    db_session.commit()

    response = client.post(
        "/api/v1/orders/checkout",
        json={"shipping_address": "Digital delivery", "payment_method": "CREDIT_CARD", "use_points": 1},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["total_amount"] == "2000.00"
    assert body["points_used"] == 1
    assert body["final_amount"] == "1000.00"
    assert body["payment_transaction_ids"]

    order = db_session.query(Order).one()
    payment = db_session.query(Payment).one()
    product = db_session.get(Product, sample_data["product"].id)
    assert order.status == OrderStatusEnum.PENDING
    assert payment.method == PaymentMethodEnum.CREDIT_CARD
    assert payment.status == PaymentStatusEnum.UNPAID
    assert product.stock_quantity == 3
    assert db_session.query(CartItem).count() == 0


def test_order_status_flow_awards_points(client, db_session, sample_data):
    app = client.app
    buyer = sample_data["buyer"]
    seller = sample_data["seller"]
    admin = sample_data["admin"]
    product = sample_data["product"]

    order = Order(user_id=buyer.id, store_id=sample_data["store"].id, total_amount=Decimal("1000.00"), points_used=0, discount_amount=Decimal("0.00"), final_amount=Decimal("1000.00"), status=OrderStatusEnum.PENDING, shipping_address="x")
    db_session.add(order)
    db_session.flush()
    db_session.add(OrderItem(order_id=order.id, product_id=product.id, unit_price=Decimal("1000.00"), quantity=1))
    db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: seller
    response = client.put(f"/api/v1/orders/{order.id}/status", json={"status": "PROCESSING"})
    assert response.status_code == 200

    response = client.put(f"/api/v1/orders/{order.id}/status", json={"status": "SHIPPED"})
    assert response.status_code == 200

    app.dependency_overrides[get_current_user] = lambda: admin
    response = client.put(f"/api/v1/orders/{order.id}/status", json={"status": "COMPLETED"})
    assert response.status_code == 200

    db_session.refresh(buyer)
    assert buyer.reward_points >= 10


def test_payment_webhook_updates_payment_and_order(client, db_session, sample_data):
    app = client.app
    app.dependency_overrides[get_current_user] = lambda: sample_data["buyer"]

    db_session.add(CartItem(cart_id=sample_data["cart"].id, product_id=sample_data["product"].id, quantity=1))
    db_session.commit()
    checkout = client.post(
        "/api/v1/orders/checkout",
        json={"shipping_address": "Digital delivery", "payment_method": "PAYPAL", "use_points": 0},
    )
    assert checkout.status_code == 201

    payment = db_session.query(Payment).one()
    payment.transaction_id = "txn-123"
    db_session.commit()

    response = client.post(
        "/api/v1/payments/webhook",
        json={"transaction_id": "txn-123", "payment_status": "PAID", "order_id": str(payment.order_id)},
        headers={"X-Webhook-Secret": "change-me"},
    )
    assert response.status_code == 200
    assert response.json()["order_status"] == "PAID"
