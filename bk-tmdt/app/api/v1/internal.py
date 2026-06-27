"""Internal endpoints — called by bk-cacao only, not exposed publicly."""
import os
from uuid import UUID

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.models import Product

router = APIRouter()

CACAO_BASE_URL = os.getenv("CACAO_URL", "http://localhost:8001")


class AiTagsPayload(BaseModel):
    ai_tags: list[str]


def _index_in_cacao(product_id: str) -> None:
    query = """
        mutation IndexProduct($productId: String!) {
            indexProduct(productId: $productId)
        }
    """
    try:
        with httpx.Client(timeout=60.0) as client:
            resp = client.post(
                f"{CACAO_BASE_URL}/graphql",
                json={"query": query, "variables": {"productId": product_id}},
            )
            if resp.status_code != 200:
                print(f"[cacao index] HTTP {resp.status_code} for {product_id}")
            else:
                print(f"[cacao index] done for {product_id}")
    except Exception as e:
        print(f"[cacao index] failed for {product_id}: {e}")


@router.post("/products/{product_id}/ai-tags", status_code=status.HTTP_200_OK)
def save_ai_tags(
    product_id: UUID,
    payload: AiTagsPayload,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> dict:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")

    product.ai_tags = payload.ai_tags
    product.is_active = True
    db.add(product)
    db.commit()

    background_tasks.add_task(_index_in_cacao, str(product_id))

    return {"ok": True, "product_id": str(product_id), "ai_tags_count": len(payload.ai_tags)}
