from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Category, Order, OrderItem, Product


def revenue_bar_chart(db: Session, store_id, start_date, end_date, interval: str):
    date_expr = func.date(Order.created_at)
    if interval == "weekly":
        date_expr = func.date_trunc("week", Order.created_at)
    elif interval == "monthly":
        date_expr = func.date_trunc("month", Order.created_at)

    statement = (
        select(date_expr.label("date"), func.coalesce(func.sum(Order.final_amount), 0).label("revenue"))
        .where(Order.store_id == store_id, Order.status == "COMPLETED", func.date(Order.created_at).between(start_date, end_date))
        .group_by(date_expr)
        .order_by(date_expr)
    )
    return list(db.execute(statement).all())


def revenue_pie_chart(db: Session, store_id, month: int, year: int):
    statement = (
        select(Category.name.label("category"), func.coalesce(func.sum(OrderItem.unit_price * OrderItem.quantity), 0).label("revenue"))
        .select_from(Order)
        .join(OrderItem, OrderItem.order_id == Order.id)
        .join(Product, Product.id == OrderItem.product_id)
        .join(Category, Category.id == Product.category_id)
        .where(
            Order.store_id == store_id,
            Order.status == "COMPLETED",
            func.extract("month", Order.created_at) == month,
            func.extract("year", Order.created_at) == year,
        )
        .group_by(Category.name)
        .order_by(Category.name)
    )
    rows = list(db.execute(statement).all())
    total = sum(Decimal(str(row.revenue)) for row in rows) if rows else Decimal("0")
    return [
        {
            "category": row.category,
            "revenue": Decimal(str(row.revenue)),
            "percentage": float((Decimal(str(row.revenue)) / total * Decimal("100")) if total else Decimal("0")),
        }
        for row in rows
    ]
