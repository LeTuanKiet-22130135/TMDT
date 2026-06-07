from uuid import UUID

from app.models import ReportStatusEnum
from app.schemas.base import ORMModel


class UserAdminRead(ORMModel):
    id: UUID
    email: str
    full_name: str
    role: str
    is_active: bool
    is_verified: bool


class StoreAdminRead(ORMModel):
    id: UUID
    owner_id: UUID
    name: str
    rating: float
    is_active: bool


class ReportAdminRead(ORMModel):
    id: UUID
    reporter_id: UUID
    reported_store_id: UUID | None
    reported_user_id: UUID | None
    report_type: str
    reason: str
    status: ReportStatusEnum
