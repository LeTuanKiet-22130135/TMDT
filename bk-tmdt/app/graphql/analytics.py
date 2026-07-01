from datetime import datetime, timedelta, timezone
from decimal import Decimal
import strawberry
from sqlalchemy import select, func, Date, cast, String
from typing import List

from app.models import Order, Store, OrderStatusEnum, OrderItem, Product, Category

def _db(info: strawberry.types.Info):
    return info.context["db"]

def _current_user(info: strawberry.types.Info):
    return info.context.get("current_user")


@strawberry.type
class RevenueDataPoint:
    date: str
    revenue: float


@strawberry.type
class CategoryRevenueDataPoint:
    category_name: str
    revenue: float


@strawberry.type
class RevenueStats:
    total_revenue: float
    total_orders: int
    chart_data: List[RevenueDataPoint]
    revenue_by_category: List[CategoryRevenueDataPoint]


@strawberry.type
class AnalyticsQuery:
    @strawberry.field
    def seller_revenue_stats(self, info: strawberry.types.Info, period: str) -> RevenueStats:
        user = _current_user(info)
        if not user:
            raise Exception("Authentication required")
        if user.role not in ["SELLER", "ADMIN"]:
            raise Exception("Access denied: Not a seller")

        db = _db(info)
        store = db.execute(select(Store).where(Store.owner_id == user.id)).scalar_one_or_none()
        if not store:
            return RevenueStats(total_revenue=0.0, total_orders=0, chart_data=[])

        now = datetime.now(timezone.utc)
        if period == "7d":
            start_date = now - timedelta(days=7)
            interval_days = 7
        elif period == "30d":
            start_date = now - timedelta(days=30)
            interval_days = 30
        elif period == "1y":
            start_date = now - timedelta(days=365)
            interval_days = 365
        else:
            raise ValueError("Invalid period. Use '7d', '30d', or '1y'.")

        # Get total revenue and orders
        stmt_totals = (
            select(
                func.sum(Order.final_amount).label("total_revenue"),
                func.count(Order.id).label("total_orders"),
            )
            .where(
                Order.store_id == store.id,
                Order.status.in_([OrderStatusEnum.PAID, OrderStatusEnum.COMPLETED]),
                Order.created_at >= start_date,
            )
        )
        totals = db.execute(stmt_totals).first()
        total_revenue = float(totals.total_revenue) if totals and totals.total_revenue else 0.0
        total_orders = int(totals.total_orders) if totals and totals.total_orders else 0

        # Group by date for chart data
        if period == "1y":
            # Group by month for 1 year
            date_expr = func.to_char(Order.created_at, 'YYYY-MM')
        else:
            # Group by date
            date_expr = func.to_char(Order.created_at, 'YYYY-MM-DD')

        stmt_chart = (
            select(
                date_expr.label("date_label"),
                func.sum(Order.final_amount).label("revenue")
            )
            .where(
                Order.store_id == store.id,
                Order.status.in_([OrderStatusEnum.PAID, OrderStatusEnum.COMPLETED]),
                Order.created_at >= start_date,
            )
            .group_by(date_expr)
            .order_by(date_expr)
        )
        
        rows = db.execute(stmt_chart).all()
        chart_data_map = {row.date_label: float(row.revenue) for row in rows}
        
        # Fill missing dates for 7d and 30d
        chart_data = []
        if period in ["7d", "30d"]:
            for i in range(interval_days):
                d = (start_date + timedelta(days=i+1)).strftime('%Y-%m-%d')
                chart_data.append(RevenueDataPoint(date=d, revenue=chart_data_map.get(d, 0.0)))
        else:
            # For 1y, fill missing months
            for i in range(12):
                # approximate month subtraction
                m = (now.replace(day=1) - timedelta(days=30 * (11 - i))).strftime('%Y-%m')
                chart_data.append(RevenueDataPoint(date=m, revenue=chart_data_map.get(m, 0.0)))

        # Group by category for pie chart
        stmt_category = (
            select(
                Category.name.label("category_name"),
                func.sum(OrderItem.unit_price * OrderItem.quantity).label("revenue")
            )
            .select_from(Order)
            .join(OrderItem, OrderItem.order_id == Order.id)
            .join(Product, Product.id == OrderItem.product_id)
            .join(Category, Category.id == Product.category_id)
            .where(
                Order.store_id == store.id,
                Order.status.in_([OrderStatusEnum.PAID, OrderStatusEnum.COMPLETED]),
                Order.created_at >= start_date,
            )
            .group_by(Category.name)
        )
        cat_rows = db.execute(stmt_category).all()
        revenue_by_category = [
            CategoryRevenueDataPoint(category_name=row.category_name, revenue=float(row.revenue))
            for row in cat_rows if row.revenue is not None and row.revenue > 0
        ]

        return RevenueStats(
            total_revenue=total_revenue,
            total_orders=total_orders,
            chart_data=chart_data,
            revenue_by_category=revenue_by_category
        )
