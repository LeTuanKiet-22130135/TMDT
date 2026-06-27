from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Report, Store, User


def list_users(db: Session) -> list[User]:
    return list(db.scalars(select(User).order_by(User.created_at.desc())).all())


def list_stores(db: Session) -> list[Store]:
    return list(db.scalars(select(Store).order_by(Store.created_at.desc())).all())


def list_reports(db: Session) -> list[Report]:
    return list(db.scalars(select(Report).order_by(Report.created_at.desc())).all())
