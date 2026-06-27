from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_admin, get_db
from app.crud.admin import list_reports, list_stores, list_users
from app.models import Report, ReportStatusEnum, Store, User
from app.schemas.admin import ReportAdminRead, StoreAdminRead, UserAdminRead


router = APIRouter()


@router.get("/users", response_model=list[UserAdminRead])
def admin_list_users(db: Session = Depends(get_db), _: User = Depends(get_current_admin)) -> list[UserAdminRead]:
    return [UserAdminRead.model_validate(user) for user in list_users(db)]


@router.put("/users/{user_id}/block", response_model=UserAdminRead)
def admin_block_user(user_id: UUID, db: Session = Depends(get_db), _: User = Depends(get_current_admin)) -> UserAdminRead:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.is_active = False
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserAdminRead.model_validate(user)


@router.get("/stores", response_model=list[StoreAdminRead])
def admin_list_stores(db: Session = Depends(get_db), _: User = Depends(get_current_admin)) -> list[StoreAdminRead]:
    return [StoreAdminRead.model_validate(store) for store in list_stores(db)]


@router.put("/stores/{store_id}/disable", response_model=StoreAdminRead)
def admin_disable_store(store_id: UUID, db: Session = Depends(get_db), _: User = Depends(get_current_admin)) -> StoreAdminRead:
    store = db.get(Store, store_id)
    if store is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store not found")
    store.is_active = False
    db.add(store)
    db.commit()
    db.refresh(store)
    return StoreAdminRead.model_validate(store)


@router.get("/reports", response_model=list[ReportAdminRead])
def admin_list_reports(db: Session = Depends(get_db), _: User = Depends(get_current_admin)) -> list[ReportAdminRead]:
    return [ReportAdminRead.model_validate(report) for report in list_reports(db)]


@router.put("/reports/{report_id}/resolve", response_model=ReportAdminRead)
def admin_resolve_report(report_id: UUID, db: Session = Depends(get_db), _: User = Depends(get_current_admin)) -> ReportAdminRead:
    report = db.get(Report, report_id)
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    report.status = ReportStatusEnum.RESOLVED
    db.add(report)
    db.commit()
    db.refresh(report)
    return ReportAdminRead.model_validate(report)
