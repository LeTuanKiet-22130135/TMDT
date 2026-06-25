"""Internal endpoints — called by bk-cacao only, not exposed publicly."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.models import Product

router = APIRouter()


class AiTagsPayload(BaseModel):
    ai_tags: list[str]


@router.post("/products/{product_id}/ai-tags", status_code=status.HTTP_200_OK)
def save_ai_tags(
    product_id: UUID,
    payload: AiTagsPayload,
    db: Session = Depends(get_db),
) -> dict:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")

    product.ai_tags = payload.ai_tags
    db.add(product)
    db.commit()
    return {"ok": True, "product_id": str(product_id), "ai_tags_count": len(payload.ai_tags)}
