from decimal import Decimal

from app.core.config import settings


def points_from_amount(amount: Decimal) -> int:
    threshold = Decimal(str(settings.reward_points_earn_threshold_vnd))
    return int(amount // threshold)


def points_to_discount(points: int) -> Decimal:
    return Decimal(points * settings.reward_point_value_vnd)
