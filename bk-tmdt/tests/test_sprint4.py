from app.api.dependencies import get_current_admin, get_current_seller, get_current_user, get_current_user_optional
from app.models import Comment, Report, ReportStatusEnum, Store, User


def test_review_comment_admin_and_seller_routes(client, db_session, sample_data):
    app = client.app
    buyer = sample_data["buyer"]
    seller = sample_data["seller"]
    admin = sample_data["admin"]
    product = sample_data["product"]
    store = sample_data["store"]

    # Make a completed order item so the buyer can review.
    from app.models import Order, OrderItem, OrderStatusEnum
    from decimal import Decimal

    order = Order(user_id=buyer.id, store_id=store.id, total_amount=Decimal("1000.00"), points_used=0, discount_amount=Decimal("0.00"), final_amount=Decimal("1000.00"), status=OrderStatusEnum.COMPLETED, shipping_address="x")
    db_session.add(order)
    db_session.flush()
    order_item = OrderItem(order_id=order.id, product_id=product.id, unit_price=Decimal("1000.00"), quantity=1)
    db_session.add(order_item)
    db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: buyer
    response = client.post(
        "/api/v1/social/reviews",
        json={"order_item_id": str(order_item.id), "product_id": str(product.id), "rating": 5, "comment": "Great work"},
    )
    assert response.status_code == 201

    app.dependency_overrides[get_current_user_optional] = lambda: None
    response = client.post(f"/api/v1/social/products/{product.id}/comments", json={"content": "Is commercial use included?"})
    assert response.status_code == 201

    app.dependency_overrides[get_current_user] = lambda: seller
    parent_comment_id = response.json()["id"]
    response = client.post(f"/api/v1/social/comments/{parent_comment_id}/reply", json={"content": "Yes, with licensing options."})
    assert response.status_code == 201

    app.dependency_overrides[get_current_admin] = lambda: admin
    report = Report(reporter_id=buyer.id, reported_store_id=store.id, reported_user_id=None, report_type="STORE_VIOLATION", reason="Test report", status=ReportStatusEnum.PENDING)
    db_session.add(report)
    db_session.commit()

    response = client.put(f"/api/v1/admin/users/{buyer.id}/block")
    assert response.status_code == 200

    response = client.put(f"/api/v1/admin/stores/{store.id}/disable")
    assert response.status_code == 200
    assert response.json()["is_active"] is False

    response = client.put(f"/api/v1/admin/reports/{report.id}/resolve")
    assert response.status_code == 200
    assert response.json()["status"] == "RESOLVED"


def test_seller_analytics_routes(client, db_session, sample_data):
    app = client.app
    seller = sample_data["seller"]
    store = sample_data["store"]

    from app.models import Order, OrderItem, OrderStatusEnum
    from decimal import Decimal
    from datetime import datetime, timezone

    order = Order(user_id=sample_data["buyer"].id, store_id=store.id, total_amount=Decimal("1500.00"), points_used=0, discount_amount=Decimal("0.00"), final_amount=Decimal("1500.00"), status=OrderStatusEnum.COMPLETED, shipping_address="x", created_at=datetime.now(timezone.utc))
    db_session.add(order)
    db_session.flush()
    db_session.add(OrderItem(order_id=order.id, product_id=sample_data["product"].id, unit_price=Decimal("1500.00"), quantity=1))
    db_session.commit()

    app.dependency_overrides[get_current_seller] = lambda: seller
    response = client.get("/api/v1/seller/stats/revenue-bar-chart", params={"start_date": "2026-01-01", "end_date": "2026-12-31", "interval": "daily"})
    assert response.status_code == 200
    assert isinstance(response.json(), list)

    response = client.get("/api/v1/seller/stats/revenue-pie-chart", params={"month": 6, "year": 2026})
    assert response.status_code == 200
    assert isinstance(response.json(), list)
