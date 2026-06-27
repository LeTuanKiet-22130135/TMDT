from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_seller, get_db
from app.crud.analytics import revenue_bar_chart, revenue_pie_chart
from app.crud.stores import get_store_by_owner
from app.models import User


router = APIRouter()


@router.get("/stats/revenue-bar-chart")
def seller_revenue_bar_chart(
    start_date: date = Query(...),
    end_date: date = Query(...),
    interval: str = Query(default="daily", pattern="^(daily|weekly|monthly)$"),
    db: Session = Depends(get_db),
    current_seller: User = Depends(get_current_seller),
):
    store = get_store_by_owner(db, current_seller.id)
    if store is None:
        return []
    rows = revenue_bar_chart(db, store.id, start_date, end_date, interval)
    return [{"date": str(row.date), "revenue": row.revenue} for row in rows]


@router.get("/stats/revenue-pie-chart")
def seller_revenue_pie_chart(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2000, le=2100),
    db: Session = Depends(get_db),
    current_seller: User = Depends(get_current_seller),
):
    store = get_store_by_owner(db, current_seller.id)
    if store is None:
        return []
    return revenue_pie_chart(db, store.id, month, year)
