import asyncio
import os
from typing import Optional
from uuid import UUID
import httpx

import strawberry
from strawberry.types import Info
from sqlalchemy import select

from app.models import Store, Category, Product
from app.graphql.types import to_product_type, ProductType
from app.graphql.mutations.utils import _db

CACAO_BASE_URL = os.getenv("CACAO_URL", "http://localhost:8001")

async def _trigger_ai_tagging(product_id: str, image_url: str, callback_url: str) -> None:
    print(f"[AI tagging] disabled, skipping trigger for {product_id}")

async def _trigger_cacao_index(product_id: str) -> None:
    """Fire-and-forget: ask bk-cacao to build tag_vector + embedding for new product."""
    query = """
        mutation IndexProduct($productId: String!) {
            indexProduct(productId: $productId)
        }
    """
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"{CACAO_BASE_URL}/graphql",
                json={"query": query, "variables": {"productId": product_id}},
            )
            if resp.status_code != 200:
                print(f"[cacao index] HTTP {resp.status_code} for {product_id}")
    except Exception as e:
        print(f"[cacao index] failed for {product_id}: {e}")

@strawberry.type
class ProductMutation:
    @strawberry.mutation
    def create_product(
        self,
        info: Info,
        name: str,
        description: str,
        price: float,
        image_urls: list[str],
        category_id: Optional[UUID] = None,
        main_file_url: Optional[str] = None,
        user_tags: Optional[list[str]] = None,
        license_type: Optional[str] = "personal",
        software_tags: Optional[list[str]] = None,
        format_tags: Optional[list[str]] = None,
        stock_quantity: int = 999,
    ) -> ProductType:
        user = info.context.get("current_user")
        if user is None:
            raise Exception("Bạn chưa đăng nhập")

        db = _db(info)
        store = db.scalar(select(Store).where(Store.owner_id == user.id))
        if store is None:
            store_name = f"{user.full_name.strip()} ({user.email.split('@')[0]})"
            store = Store(owner_id=user.id, name=store_name)
            db.add(store)
            db.flush()

        if category_id is not None:
            category = db.get(Category, category_id)
            if category is None:
                raise Exception("Danh mục không tồn tại")

        product = Product(
            store_id=store.id,
            category_id=category_id,
            name=name.strip(),
            description=description.strip(),
            price=price,
            stock_quantity=stock_quantity,
            image_urls=image_urls,
            main_file_url=main_file_url,
            license_type=license_type or "personal",
            user_tags=user_tags or [],
            ai_tags=[],
            software_tags=software_tags or [],
            format_tags=format_tags or [],
        )
        db.add(product)
        db.commit()
        db.refresh(product)

        if image_urls:
            from app.core.config import settings
            tmdt_base = os.getenv("TMDT_INTERNAL_URL", "http://localhost:8000")
            product_id_str = str(product.id)
            first_image = image_urls[0]
            callback_url = f"{tmdt_base}/api/v1/internal/products/{product_id_str}/ai-tags"
            asyncio.create_task(_trigger_ai_tagging(product_id_str, first_image, callback_url))

        asyncio.create_task(_trigger_cacao_index(str(product.id)))

        return to_product_type(product)
