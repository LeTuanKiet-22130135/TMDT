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
from app.graphql.types import (
    ProductConnection,
    ProductType,
    StoreConnection,
    StoreType,
    UserType,
    to_product_type,
    to_store_type,
    to_user_type,
)
from app.models import User


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
    def me(self, info: Info) -> UserType | None:
        user = _current_user(info)
        if user is None:
            return None
        return to_user_type(user)

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

from app.graphql.mutations import AuthMutation

@strawberry.type
class Mutation(AuthMutation):
    pass

schema = strawberry.Schema(query=Query, mutation=Mutation)
graphql_router = GraphQLRouter(schema, context_getter=get_graphql_context)