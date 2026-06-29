from math import ceil
from enum import Enum
from uuid import UUID
from datetime import datetime, timedelta, timezone
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
    list_popular_tags,
    list_products_by_store,
    list_suggested,
    list_trending_by_tag,
    search_products,
)
from app.crud.stores import get_store, search_stores
from app.graphql.context import get_graphql_context
from app.graphql.analytics import AnalyticsQuery
from decimal import Decimal
from sqlalchemy import select, func
from app.graphql.types import (
    AuthorType,
    CategoryType,
    FollowedAuthorType,
    ProductConnection,
    ProductType,
    StoreConnection,
    StoreType,
    UserType,
    AdminStatsType,
    UserConnection,
    OrderConnection,
    ReportConnection,
    ReviewType,
    CommentType,
    ReviewConnection,
    CommentConnection,
    WalletType,
    to_author_type,
    to_category_type,
    to_product_type,
    to_store_type,
    to_user_type,
    to_order_type,
    to_report_type,
    to_review_type,
    to_comment_type,
    to_wallet_type,
    RevenueDataPointType,
    CategoryRevenueDataPointType,
    WalletTransactionType,
    to_wallet_transaction_type,
    AdminWalletTransactionType,
    AdminWalletTransactionConnection,
    AdminWalletStatsType,
    to_admin_wallet_transaction_type,
)
from app.models import Category, User, Order, OrderItem, Report, Product, Store, RoleEnum, OrderStatusEnum, UserFollow, Review, Comment, ProductLike, Wallet



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
class Query(AnalyticsQuery):
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
    def my_wallet(self, info: Info) -> WalletType | None:
        user = _current_user(info)
        if user is None:
            return None
        db = _db(info)
        wallet = db.scalar(select(Wallet).where(Wallet.user_id == user.id))
        if wallet is None:
            # Tạo ví mới nếu chưa có
            from decimal import Decimal
            from app.models.entities import WalletStatusEnum
            wallet = Wallet(user_id=user.id, balance=Decimal("0.00"), status=WalletStatusEnum.ACTIVE)
            db.add(wallet)
            db.commit()
            db.refresh(wallet)
        return to_wallet_type(wallet)

    @strawberry.field
    def my_purchased_products(self, info: Info) -> list[ProductType]:
        user = _current_user(info)
        if user is None:
            return []
        db = _db(info)
        stmt = (
            select(Product)
            .join(OrderItem, OrderItem.product_id == Product.id)
            .join(Order, OrderItem.order_id == Order.id)
            .where(
                Order.user_id == user.id,
                Order.status.in_([OrderStatusEnum.PAID, OrderStatusEnum.COMPLETED]),
            )
            .distinct()
        )
        return [to_product_type(p) for p in db.scalars(stmt).all()]

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
    def my_liked_products(self, info: Info) -> list[ProductType]:
        user = _current_user(info)
        if user is None:
            return []
        db = _db(info)
        stmt = (
            select(Product)
            .join(ProductLike, ProductLike.product_id == Product.id)
            .where(ProductLike.user_id == user.id, Product.is_active == True)
            .order_by(ProductLike.created_at.desc())
        )
        return [to_product_type(p) for p in db.scalars(stmt).all()]

    @strawberry.field
    def is_liked(self, info: Info, product_id: UUID) -> bool:
        user = _current_user(info)
        if user is None:
            return False
        db = _db(info)
        return db.scalar(
            select(func.count(ProductLike.id)).where(
                ProductLike.user_id == user.id,
                ProductLike.product_id == product_id,
            )
        ) > 0

    @strawberry.field
    def my_followed_authors(self, info: Info) -> list[FollowedAuthorType]:
        user = _current_user(info)
        if user is None:
            return []
        db = _db(info)
        follows = db.scalars(select(UserFollow).where(UserFollow.follower_id == user.id)).all()
        result = []
        for f in follows:
            author = db.get(User, f.followed_id)
            if author is None or not author.is_active:
                continue
            count = db.scalar(
                select(func.count(Product.id))
                .join(Store, Product.store_id == Store.id)
                .where(Store.owner_id == author.id)
            ) or 0
            result.append(FollowedAuthorType(
                id=str(author.id),
                shortlink=author.shortlink or '',
                full_name=author.full_name,
                avatar_url=author.avatar_url,
                is_verified=author.is_verified,
                is_gold=author.is_gold,
                product_count=count,
            ))
        return result

    @strawberry.field
    def is_following(self, info: Info, shortlink: str) -> bool:
        user = _current_user(info)
        if user is None:
            return False
        db = _db(info)
        author = db.scalar(select(User).where(User.shortlink == shortlink, User.is_active == True))
        if author is None:
            return False
        return db.scalar(
            select(func.count(UserFollow.id)).where(
                UserFollow.follower_id == user.id,
                UserFollow.followed_id == author.id,
            )
        ) > 0

    @strawberry.field
    def following_feed(self, info: Info, page: int = 1, limit: int = 20) -> ProductConnection:
        user = _current_user(info)
        if user is None:
            return ProductConnection(items=[], total_items=0, total_pages=0)
        db = _db(info)
        safe_page = max(page, 1)
        safe_limit = min(max(limit, 1), 50)
        followed_ids = db.scalars(
            select(UserFollow.followed_id).where(UserFollow.follower_id == user.id)
        ).all()
        if not followed_ids:
            return ProductConnection(items=[], total_items=0, total_pages=0)
        stmt = (
            select(Product)
            .join(Store, Product.store_id == Store.id)
            .where(Store.owner_id.in_(followed_ids), Product.is_active == True)
            .order_by(Product.created_at.desc())
        )
        total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
        items = db.scalars(stmt.offset((safe_page - 1) * safe_limit).limit(safe_limit)).all()
        from math import ceil
        return ProductConnection(
            items=[to_product_type(p) for p in items],
            total_items=total,
            total_pages=ceil(total / safe_limit) if total else 0,
        )

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
    def product_reviews(self, info: Info, product_id: UUID, page: int = 1, limit: int = 10) -> ReviewConnection:
        db = _db(info)
        safe_page = max(page, 1)
        safe_limit = min(max(limit, 1), 50)
        
        stmt = select(Review).where(Review.product_id == product_id).order_by(Review.created_at.desc())
        total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
        items = db.scalars(stmt.offset((safe_page - 1) * safe_limit).limit(safe_limit)).all()
        
        avg_rating = db.scalar(select(func.avg(Review.rating)).where(Review.product_id == product_id)) or 0.0
        
        from math import ceil
        return ReviewConnection(
            items=[to_review_type(r) for r in items],
            total_items=total,
            total_pages=ceil(total / safe_limit) if total else 0,
            average_rating=float(avg_rating)
        )

    @strawberry.field
    def product_comments(self, info: Info, product_id: UUID, page: int = 1, limit: int = 20) -> CommentConnection:
        db = _db(info)
        safe_page = max(page, 1)
        safe_limit = min(max(limit, 1), 50)
        
        # Optionally, you can only fetch root comments here (parent_id is null) 
        # But for simplicity, we just fetch all or order by newest
        stmt = select(Comment).where(Comment.product_id == product_id).order_by(Comment.created_at.desc())
        total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
        items = db.scalars(stmt.offset((safe_page - 1) * safe_limit).limit(safe_limit)).all()
        
        from math import ceil
        return CommentConnection(
            items=[to_comment_type(c) for c in items],
            total_items=total,
            total_pages=ceil(total / safe_limit) if total else 0,
        )

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
    def trending_by_tag(self, info: Info, tag: str, limit: int = 20) -> list[ProductType]:
        safe_limit = min(max(limit, 1), 100)
        return [to_product_type(p) for p in list_trending_by_tag(_db(info), tag, safe_limit)]

    @strawberry.field
    def popular_tags(self, info: Info, limit: int = 20) -> list[str]:
        safe_limit = min(max(limit, 1), 50)
        return list_popular_tags(_db(info), safe_limit)

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

    @strawberry.field
    def admin_revenue_chart(self, info: Info, time_period: str) -> list[RevenueDataPointType]:
        user = _current_user(info)
        if user is None or user.role != RoleEnum.ADMIN:
            raise Exception("Not authorized")
        
        db = _db(info)
        now = datetime.now(timezone.utc)
        
        if time_period == "7days":
            start_date = now - timedelta(days=7)
            trunc_level = "day"
            date_format = "DD/MM"
        elif time_period == "30days":
            start_date = now - timedelta(days=30)
            trunc_level = "day"
            date_format = "DD/MM"
        else: # year
            start_date = datetime(now.year, 1, 1, tzinfo=timezone.utc)
            trunc_level = "month"
            date_format = "MM/YYYY"

        stmt = (
            select(
                func.to_char(func.date_trunc(trunc_level, Order.created_at), date_format).label("date_label"),
                func.sum(Order.final_amount).label("total")
            )
            .where(Order.status == OrderStatusEnum.COMPLETED)
            .where(Order.created_at >= start_date)
            .group_by(func.date_trunc(trunc_level, Order.created_at))
            .order_by(func.date_trunc(trunc_level, Order.created_at))
        )
        
        results = db.execute(stmt).all()
        return [RevenueDataPointType(date=r.date_label, revenue=float(r.total)) for r in results]

    @strawberry.field
    def admin_category_revenue(self, info: Info, time_period: str) -> list[CategoryRevenueDataPointType]:
        user = _current_user(info)
        if user is None or user.role != RoleEnum.ADMIN:
            raise Exception("Not authorized")
        
        db = _db(info)
        now = datetime.now(timezone.utc)
        
        if time_period == "7days":
            start_date = now - timedelta(days=7)
        elif time_period == "30days":
            start_date = now - timedelta(days=30)
        else: # year
            start_date = datetime(now.year, 1, 1, tzinfo=timezone.utc)
            
        stmt = (
            select(
                Category.name,
                func.sum(OrderItem.unit_price * OrderItem.quantity).label("total")
            )
            .select_from(Order)
            .join(OrderItem, Order.id == OrderItem.order_id)
            .join(Product, OrderItem.product_id == Product.id)
            .join(Category, Product.category_id == Category.id)
            .where(Order.status == OrderStatusEnum.COMPLETED)
            .where(Order.created_at >= start_date)
            .group_by(Category.name)
            .order_by(func.sum(OrderItem.unit_price * OrderItem.quantity).desc())
            .limit(10)
        )
        
        results = db.execute(stmt).all()
        
        colors = ["#F65C88", "#38bdf8", "#fbbf24", "#4ade80", "#a855f7", "#ec4899", "#14b8a6", "#f97316"]
        
        data = []
        for i, r in enumerate(results):
            data.append(CategoryRevenueDataPointType(
                name=r.name,
                value=float(r.total),
                color=colors[i % len(colors)]
            ))
            
        return data

    @strawberry.field
    def admin_wallet_stats(self, info: Info) -> AdminWalletStatsType:
        from app.models.entities import WalletTransaction, WalletTransactionTypeEnum, WalletTransactionStatusEnum
        user = _current_user(info)
        if user is None or user.role != RoleEnum.ADMIN:
            raise Exception("Not authorized")

        db = _db(info)

        def sum_type(txn_type: WalletTransactionTypeEnum) -> float:
            result = db.scalar(
                select(func.sum(WalletTransaction.amount))
                .where(WalletTransaction.transaction_type == txn_type)
                .where(WalletTransaction.status == WalletTransactionStatusEnum.SUCCESS)
            )
            return float(result or 0)

        total_topup = sum_type(WalletTransactionTypeEnum.TOPUP)
        total_payment = sum_type(WalletTransactionTypeEnum.PAYMENT)
        total_refund = sum_type(WalletTransactionTypeEnum.REFUND)
        total_withdrawal = sum_type(WalletTransactionTypeEnum.WITHDRAWAL)

        return AdminWalletStatsType(
            total_topup=total_topup,
            total_payment=total_payment,
            total_refund=total_refund,
            total_withdrawal=total_withdrawal,
            total_inflow=total_topup + total_refund,
            total_outflow=total_payment + total_withdrawal,
            total_turnover=total_topup + total_payment + total_refund + total_withdrawal,
        )

    @strawberry.field
    def admin_all_wallet_transactions(
        self,
        info: Info,
        transaction_type: str | None = None,
        status: str | None = None,
        page: int = 1,
        limit: int = 20,
    ) -> AdminWalletTransactionConnection:
        from app.models.entities import WalletTransaction as WalletTxn
        user = _current_user(info)
        if user is None or user.role != RoleEnum.ADMIN:
            raise Exception("Not authorized")

        db = _db(info)
        stmt = (
            select(WalletTxn, Wallet, User)
            .join(Wallet, WalletTxn.wallet_id == Wallet.id)
            .join(User, Wallet.user_id == User.id)
        )

        if transaction_type:
            stmt = stmt.where(WalletTxn.transaction_type == transaction_type)
        if status:
            stmt = stmt.where(WalletTxn.status == status)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_items = db.scalar(count_stmt) or 0

        safe_limit = min(max(limit, 1), 100)
        safe_page = max(page, 1)
        stmt = stmt.order_by(WalletTxn.created_at.desc()).offset((safe_page - 1) * safe_limit).limit(safe_limit)

        rows = db.execute(stmt).all()
        items = [
            to_admin_wallet_transaction_type(txn, user_email=u.email, user_id=str(u.id))
            for txn, _wallet, u in rows
        ]

        return AdminWalletTransactionConnection(
            items=items,
            total_items=total_items,
            total_pages=ceil(total_items / safe_limit) if total_items else 0,
        )

    @strawberry.field
    def admin_withdrawal_requests(self, info: Info, status: str | None = None) -> list[WalletTransactionType]:
        from app.models.entities import WalletTransaction, WalletTransactionTypeEnum
        user = _current_user(info)
        if user is None or user.role != RoleEnum.ADMIN:
            raise Exception("Not authorized")
        
        db = _db(info)
        stmt = select(WalletTransaction).where(WalletTransaction.transaction_type == WalletTransactionTypeEnum.WITHDRAWAL)
        
        if status:
            stmt = stmt.where(WalletTransaction.status == status)
            
        stmt = stmt.order_by(WalletTransaction.created_at.desc())
        
        transactions = db.scalars(stmt).all()
        return [to_wallet_transaction_type(t) for t in transactions]

from app.graphql.mutations import Mutation

schema = strawberry.Schema(query=Query, mutation=Mutation)
graphql_router = GraphQLRouter(schema, context_getter=get_graphql_context)