from decimal import Decimal

from app.schemas.base import ORMModel


class RevenueBarPoint(ORMModel):
    date: str
    revenue: Decimal


class RevenuePiePoint(ORMModel):
    category: str
    revenue: Decimal
    percentage: float
