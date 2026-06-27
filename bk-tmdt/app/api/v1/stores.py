from math import ceil
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_db
from app.crud.products import list_products_by_store
from app.crud.stores import create_store, get_store, get_store_by_name, get_store_by_owner, search_stores
from app.models import RoleEnum, Store, User
from app.schemas.product import ProductRead
from app.schemas.store import StoreCreate, StoreRead, StoreSearchResponse


router = APIRouter()


def _serialize_store(store: Store) -> StoreRead:
    return StoreRead.model_validate(store)


@router.get("/", response_model=StoreSearchResponse)
def list_or_search_stores(
    q: str | None = Query(default=None, max_length=255),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
) -> StoreSearchResponse:
    stores = search_stores(db, q)
    total_items = len(stores)
    start = (page - 1) * limit
    items = stores[start : start + limit]
    return StoreSearchResponse(items=[_serialize_store(store) for store in items], total_items=total_items, total_pages=ceil(total_items / limit) if total_items else 0)


@router.get("/{store_id}", response_model=StoreRead)
def get_store_detail(store_id: UUID, db: Session = Depends(get_db)) -> StoreRead:
    store = get_store(db, store_id)
    if store is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store not found")
    return _serialize_store(store)


@router.get("/{store_id}/products", response_model=list[ProductRead])
def get_store_products(store_id: UUID, db: Session = Depends(get_db)) -> list[ProductRead]:
    store = get_store(db, store_id)
    if store is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store not found")
    return [ProductRead.model_validate(product) for product in list_products_by_store(db, store_id)]


@router.post("/", response_model=StoreRead, status_code=status.HTTP_201_CREATED)
def register_as_seller(
    payload: StoreCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StoreRead:
    if current_user.role != RoleEnum.BUYER:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only buyers can register as sellers")

    if get_store_by_owner(db, current_user.id) is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Seller store already exists")

    if get_store_by_name(db, payload.name) is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Store name already exists")

    store = create_store(db, owner_id=current_user.id, **payload.model_dump())
    current_user.role = RoleEnum.SELLER
    db.add(current_user)
    db.commit()
    db.refresh(store)
    return _serialize_store(store)
