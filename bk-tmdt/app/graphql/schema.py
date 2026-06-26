from math import ceil
from enum import Enum
from uuid import UUID

import strawberry
from sqlalchemy.orm import Session
from strawberry.fastapi import GraphQLRouter
from strawberry.types import Info

from app.crud.products import (
    get_product,
    list_best_sellers,
    list_most_viewed,
    list_newest_products,
    list_products_by_store,
    list_suggested,
    search_products,
)
from app.crud.stores import get_store, search_stores
from app.graphql.context import get_graphql_context
from decimal import Decimal
from sqlalchemy import select, func
from app.graphql.types import (
    AuthorType,
    CategoryType,
    ProductConnection,
    ProductType,
    StoreConnection,
    StoreType,
    UserType,
    AdminStatsType,
    UserConnection,
    OrderConnection,
    ReportConnection,
    to_author_type,
    to_category_type,
    to_product_type,
    to_store_type,
    to_user_type,
    to_order_type,
    to_report_type,
)
from app.models import Category, User, Order, OrderItem, Report, Product, Store, RoleEnum, OrderStatusEnum



@strawberry.enum
class ProductSortBy(Enum):
    NEWEST = "newest"
    PRICE_ASC = "price_asc"
    PRICE_DESC = "price_desc"
    SOLD_DESC = "sold_desc"


def _db(info: Info) -> Session:
    return info.context["db"]


def _current_user(info: Info) -> User | None:
    return info.context.get("current_user")


@strawberry.type
class Query:
    @strawberry.field
    def categories(self, info: Info) -> list[CategoryType]:
        return [to_category_type(c) for c in _db(info).scalars(select(Category)).all()]

    @strawberry.field
    def me(self, info: Info) -> UserType | None:
        user = _current_user(info)
        if user is None:
            return None
        return to_user_type(user)

    @strawberry.field
    def my_purchased_product_ids(self, info: Info) -> list[strawberry.ID]:
        user = _current_user(info)
        if user is None:
            return []
        db = _db(info)
        stmt = (
            select(OrderItem.product_id)
            .join(Order, OrderItem.order_id == Order.id)
            .where(
                Order.user_id == user.id,
                Order.status.in_([OrderStatusEnum.PAID, OrderStatusEnum.COMPLETED]),
            )
            .distinct()
        )
        return [str(pid) for pid in db.scalars(stmt).all()]

    @strawberry.field
    def author(self, info: Info, shortlink: str) -> AuthorType | None:
        user = _db(info).scalar(select(User).where(User.shortlink == shortlink, User.is_active == True))
        if user is None:
            return None
        return to_author_type(user)

    @strawberry.field
    def author_products(self, info: Info, shortlink: str, page_size: int = 50) -> list[ProductType]:
        user = _db(info).scalar(select(User).where(User.shortlink == shortlink, User.is_active == True))
        if user is None or user.store is None:
            return []
        products = list_products_by_store(_db(info), user.store.id)
        return [to_product_type(p) for p in products[:page_size]]

    @strawberry.field
    def product(self, info: Info, product_id: UUID) -> ProductType | None:
        product = get_product(_db(info), product_id)
        if product is None or not product.is_active:
            return None
        return to_product_type(product)

    @strawberry.field
    def products(
        self,
        info: Info,
        q: str | None = None,
        category_id: UUID | None = None,
        brand: str | None = None,
        min_price: float | None = None,
        max_price: float | None = None,
        sort_by: ProductSortBy = ProductSortBy.NEWEST,
        page: int = 1,
        limit: int = 10,
    ) -> ProductConnection:
        safe_page = max(page, 1)
        safe_limit = min(max(limit, 1), 100)
        items, total_items = search_products(
            _db(info),
            query=q,
            category_id=category_id,
            brand=brand,
            min_price=min_price,
            max_price=max_price,
            sort_by=sort_by.value,
            offset=(safe_page - 1) * safe_limit,
            limit=safe_limit,
        )
        return ProductConnection(
            items=[to_product_type(product) for product in items],
            total_items=total_items,
            total_pages=ceil(total_items / safe_limit) if total_items else 0,
        )

    @strawberry.field
    def newest_products(self, info: Info, limit: int = 10) -> list[ProductType]:
        safe_limit = min(max(limit, 1), 100)
        return [to_product_type(product) for product in list_newest_products(_db(info), safe_limit)]

    @strawberry.field
    def best_sellers(self, info: Info, limit: int = 10) -> list[ProductType]:
        safe_limit = min(max(limit, 1), 100)
        return [to_product_type(product) for product in list_best_sellers(_db(info), safe_limit)]

    @strawberry.field
    def most_viewed(self, info: Info, limit: int = 10) -> list[ProductType]:
        safe_limit = min(max(limit, 1), 100)
        return [to_product_type(product) for product in list_most_viewed(_db(info), safe_limit)]

    @strawberry.field
    def suggested_products(self, info: Info, limit: int = 10) -> list[ProductType]:
        safe_limit = min(max(limit, 1), 100)
        return [to_product_type(product) for product in list_suggested(_db(info), safe_limit)]

    @strawberry.field
    def store(self, info: Info, store_id: UUID) -> StoreType | None:
        store = get_store(_db(info), store_id)
        if store is None:
            return None
        return to_store_type(store)

    @strawberry.field
    def stores(self, info: Info, q: str | None = None, page: int = 1, limit: int = 10) -> StoreConnection:
        safe_page = max(page, 1)
        safe_limit = min(max(limit, 1), 100)
        stores = search_stores(_db(info), q)
        total_items = len(stores)
        start = (safe_page - 1) * safe_limit
        items = stores[start : start + safe_limit]
        return StoreConnection(
            items=[to_store_type(store) for store in items],
            total_items=total_items,
            total_pages=ceil(total_items / safe_limit) if total_items else 0,
        )

    @strawberry.field
    def store_products(self, info: Info, store_id: UUID) -> list[ProductType]:
        return [to_product_type(product) for product in list_products_by_store(_db(info), store_id)]

    @strawberry.field
    def admin_stats(self, info: Info) -> AdminStatsType:
        user = _current_user(info)
        if user is None or user.role != RoleEnum.ADMIN:
            raise Exception("Not authorized")
        
        db = _db(info)
        total_users = db.scalar(select(func.count(User.id))) or 0
        total_orders = db.scalar(select(func.count(Order.id))) or 0
        total_products = db.scalar(select(func.count(Product.id))) or 0
        total_stores = db.scalar(select(func.count(Store.id))) or 0
        
        total_revenue = db.scalar(select(func.sum(Order.final_amount)).where(Order.status == OrderStatusEnum.COMPLETED)) or Decimal("0.0")
        pending_orders = db.scalar(select(func.count(Order.id)).where(Order.status == OrderStatusEnum.PENDING)) or 0
        
        return AdminStatsType(
            total_users=total_users,
            total_orders=total_orders,
            total_products=total_products,
            total_stores=total_stores,
            total_revenue=float(total_revenue),
            pending_orders=pending_orders,
        )

    @strawberry.field
    def admin_users(
        self, info: Info, page: int = 1, limit: int = 10, q: str | None = None
    ) -> UserConnection:
        user = _current_user(info)
        if user is None or user.role != RoleEnum.ADMIN:
            raise Exception("Not authorized")
        
        db = _db(info)
        safe_page = max(page, 1)
        safe_limit = min(max(limit, 1), 100)
        
        stmt = select(User)
        if q:
            stmt = stmt.where(
                User.email.ilike(f"%{q}%") | 
                User.full_name.ilike(f"%{q}%")
            )
        
        total_items = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
        
        stmt = stmt.order_by(User.created_at.desc()).offset((safe_page - 1) * safe_limit).limit(safe_limit)
        items = db.scalars(stmt).all()
        
        return UserConnection(
            items=[to_user_type(u) for u in items],
            total_items=total_items,
            total_pages=ceil(total_items / safe_limit) if total_items else 0,
        )

    @strawberry.field
    def admin_products(
        self, info: Info, page: int = 1, limit: int = 10, q: str | None = None
    ) -> ProductConnection:
        user = _current_user(info)
        if user is None or user.role != RoleEnum.ADMIN:
            raise Exception("Not authorized")
        
        db = _db(info)
        safe_page = max(page, 1)
        safe_limit = min(max(limit, 1), 100)
        
        stmt = select(Product)
        if q:
            stmt = stmt.where(Product.name.ilike(f"%{q}%"))
            
        total_items = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
        
        stmt = stmt.order_by(Product.created_at.desc()).offset((safe_page - 1) * safe_limit).limit(safe_limit)
        items = db.scalars(stmt).all()
        
        return ProductConnection(
            items=[to_product_type(p) for p in items],
            total_items=total_items,
            total_pages=ceil(total_items / safe_limit) if total_items else 0,
        )

    @strawberry.field
    def admin_orders(
        self, info: Info, page: int = 1, limit: int = 10, status: str | None = None
    ) -> OrderConnection:
        user = _current_user(info)
        if user is None or user.role != RoleEnum.ADMIN:
            raise Exception("Not authorized")
        
        db = _db(info)
        safe_page = max(page, 1)
        safe_limit = min(max(limit, 1), 100)
        
        stmt = select(Order)
        if status:
            try:
                status_enum = OrderStatusEnum(status.upper())
                stmt = stmt.where(Order.status == status_enum)
            except ValueError:
                pass
                
        total_items = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
        
        stmt = stmt.order_by(Order.created_at.desc()).offset((safe_page - 1) * safe_limit).limit(safe_limit)
        items = db.scalars(stmt).all()
        
        return OrderConnection(
            items=[to_order_type(o) for o in items],
            total_items=total_items,
            total_pages=ceil(total_items / safe_limit) if total_items else 0,
        )

    @strawberry.field
    def admin_stores(
        self, info: Info, page: int = 1, limit: int = 10, q: str | None = None
    ) -> StoreConnection:
        user = _current_user(info)
        if user is None or user.role != RoleEnum.ADMIN:
            raise Exception("Not authorized")
        
        db = _db(info)
        safe_page = max(page, 1)
        safe_limit = min(max(limit, 1), 100)
        
        stmt = select(Store)
        if q:
            stmt = stmt.where(Store.name.ilike(f"%{q}%"))
            
        total_items = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
        
        stmt = stmt.order_by(Store.created_at.desc()).offset((safe_page - 1) * safe_limit).limit(safe_limit)
        items = db.scalars(stmt).all()
        
        return StoreConnection(
            items=[to_store_type(s) for s in items],
            total_items=total_items,
            total_pages=ceil(total_items / safe_limit) if total_items else 0,
        )

    @strawberry.field
    def admin_reports(
        self, info: Info, page: int = 1, limit: int = 10
    ) -> ReportConnection:
        user = _current_user(info)
        if user is None or user.role != RoleEnum.ADMIN:
            raise Exception("Not authorized")
        
        db = _db(info)
        safe_page = max(page, 1)
        safe_limit = min(max(limit, 1), 100)
        
        stmt = select(Report)
        total_items = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
        
        stmt = stmt.order_by(Report.created_at.desc()).offset((safe_page - 1) * safe_limit).limit(safe_limit)
        items = db.scalars(stmt).all()
        
        return ReportConnection(
            items=[to_report_type(r) for r in items],
            total_items=total_items,
            total_pages=ceil(total_items / safe_limit) if total_items else 0,
        )


from app.graphql.mutations import Mutation

schema = strawberry.Schema(query=Query, mutation=Mutation)
graphql_router = GraphQLRouter(schema, context_getter=get_graphql_context)