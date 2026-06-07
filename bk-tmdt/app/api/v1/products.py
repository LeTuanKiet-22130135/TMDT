from math import ceil
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_seller, get_db
from app.crud.products import (
    create_product,
    get_product,
    list_best_sellers,
    list_most_viewed,
    list_newest_products,
    list_suggested,
    search_products,
)
from app.crud.stores import get_store_by_owner
from app.db.session import SessionLocal
from app.models import Product, Store, User
from app.schemas.product import ProductCreate, ProductListResponse, ProductRead, ProductUpdate


router = APIRouter()


def _serialize_product(product: Product) -> ProductRead:
    return ProductRead.model_validate(product)


def _seller_store(db: Session, seller: User) -> Store:
    store = get_store_by_owner(db, seller.id)
    if store is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Seller store not found")
    return store


@router.get("/newest", response_model=list[ProductRead])
def newest_products(db: Session = Depends(get_db)) -> list[ProductRead]:
    return [_serialize_product(product) for product in list_newest_products(db)]


@router.get("/best-sellers", response_model=list[ProductRead])
def best_sellers(db: Session = Depends(get_db)) -> list[ProductRead]:
    return [_serialize_product(product) for product in list_best_sellers(db)]


@router.get("/most-viewed", response_model=list[ProductRead])
def most_viewed(db: Session = Depends(get_db)) -> list[ProductRead]:
    return [_serialize_product(product) for product in list_most_viewed(db)]


@router.get("/suggested", response_model=list[ProductRead])
def suggested_products(db: Session = Depends(get_db)) -> list[ProductRead]:
    return [_serialize_product(product) for product in list_suggested(db)]


@router.get("/", response_model=ProductListResponse)
def discover_products(
    q: str | None = Query(default=None, max_length=255),
    category_id: UUID | None = None,
    brand: str | None = Query(default=None, max_length=100),
    min_price: float | None = Query(default=None, ge=0),
    max_price: float | None = Query(default=None, ge=0),
    sort_by: str = Query(default="newest", pattern="^(price_asc|price_desc|sold_desc|newest)$"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
) -> ProductListResponse:
    items, total_items = search_products(
        db,
        query=q,
        category_id=category_id,
        brand=brand,
        min_price=min_price,
        max_price=max_price,
        sort_by=sort_by,
        offset=(page - 1) * limit,
        limit=limit,
    )
    return ProductListResponse(items=[_serialize_product(product) for product in items], total_items=total_items, total_pages=ceil(total_items / limit) if total_items else 0)


@router.get("/{product_id}", response_model=ProductRead)
def get_product_detail(product_id: UUID, background_tasks: BackgroundTasks, db: Session = Depends(get_db)) -> ProductRead:
    product = get_product(db, product_id)
    if product is None or not product.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    background_tasks.add_task(_increment_view_count, product_id)
    return _serialize_product(product)


def _increment_view_count(product_id: UUID) -> None:
    db = SessionLocal()
    try:
        product = db.get(Product, product_id)
        if product is None:
            return
        product.view_count += 1
        db.commit()
    finally:
        db.close()


@router.post("/", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_seller_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    current_seller: User = Depends(get_current_seller),
) -> ProductRead:
    store = _seller_store(db, current_seller)
    product = create_product(db, store_id=store.id, **payload.model_dump())
    db.commit()
    db.refresh(product)
    return _serialize_product(product)


@router.put("/{product_id}", response_model=ProductRead)
def update_seller_product(
    product_id: UUID,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    current_seller: User = Depends(get_current_seller),
) -> ProductRead:
    store = _seller_store(db, current_seller)
    product = get_product(db, product_id)
    if product is None or product.store_id != store.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, field, value)

    db.add(product)
    db.commit()
    db.refresh(product)
    return _serialize_product(product)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_seller_product(
    product_id: UUID,
    db: Session = Depends(get_db),
    current_seller: User = Depends(get_current_seller),
) -> None:
    store = _seller_store(db, current_seller)
    product = get_product(db, product_id)
    if product is None or product.store_id != store.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    product.is_active = False
    db.add(product)
    db.commit()
