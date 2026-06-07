from pathlib import Path
import sys

from fastapi import FastAPI


if __package__ is None or __package__ == "":
	sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.core.config import settings
from app.api.v1.auth import router as auth_router
from app.api.v1.admin import router as admin_router
from app.api.v1.cart import router as cart_router
from app.api.v1.orders import router as orders_router
from app.api.v1.payments import router as payments_router
from app.api.v1.seller import router as seller_router
from app.api.v1.social import router as social_router
from app.api.v1.products import router as products_router
from app.api.v1.stores import router as stores_router
from app.graphql import graphql_router


app = FastAPI(title=settings.app_name)
app.include_router(auth_router, prefix=f"{settings.api_v1_prefix}/auth", tags=["auth"])
app.include_router(cart_router, prefix=f"{settings.api_v1_prefix}/cart", tags=["cart"])
app.include_router(orders_router, prefix=f"{settings.api_v1_prefix}/orders", tags=["orders"])
app.include_router(payments_router, prefix=f"{settings.api_v1_prefix}/payments", tags=["payments"])
app.include_router(social_router, prefix=f"{settings.api_v1_prefix}/social", tags=["social"])
app.include_router(admin_router, prefix=f"{settings.api_v1_prefix}/admin", tags=["admin"])
app.include_router(seller_router, prefix=f"{settings.api_v1_prefix}/seller", tags=["seller"])
app.include_router(stores_router, prefix=f"{settings.api_v1_prefix}/stores", tags=["stores"])
app.include_router(products_router, prefix=f"{settings.api_v1_prefix}/products", tags=["products"])
app.include_router(graphql_router, prefix="/graphql", tags=["graphql"])


if __name__ == "__main__":
	import uvicorn

	uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False)
