"""AI tagging endpoint — receives image URL, runs ONNX tagger, calls back bk-tmdt."""
from __future__ import annotations

import io
from typing import Optional

import httpx
from fastapi import APIRouter, BackgroundTasks, HTTPException, status
from pydantic import BaseModel
from PIL import Image

from tagger import tag_image

router = APIRouter()


class TagImageRequest(BaseModel):
    product_id: str
    image_url: str
    callback_url: str
    threshold: Optional[float] = 0.35


class TagImageResponse(BaseModel):
    product_id: str
    ai_tags: list[str]
    status: str = "queued"


@router.post("/tag-image", response_model=TagImageResponse)
async def tag_image_endpoint(
    payload: TagImageRequest,
    background: BackgroundTasks,
) -> TagImageResponse:
    """
    Accepts a product image URL, runs ONNX tagging asynchronously,
    and POSTs results to the callback URL.
    """
    background.add_task(
        _process_and_callback,
        payload.product_id,
        payload.image_url,
        payload.callback_url,
        payload.threshold or 0.35,
    )
    return TagImageResponse(product_id=payload.product_id, ai_tags=[], status="queued")


async def _process_and_callback(
    product_id: str,
    image_url: str,
    callback_url: str,
    threshold: float,
) -> None:
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.get(image_url)
            resp.raise_for_status()
            image = Image.open(io.BytesIO(resp.content))

        results = tag_image(image, threshold=threshold)
        ai_tags = [r.tag for r in results]

        # Callback bk-tmdt to persist AI tags
        async with httpx.AsyncClient(timeout=30.0) as client:
            cb_resp = await client.post(callback_url, json={"ai_tags": ai_tags})
            cb_resp.raise_for_status()

        print(f"[AI tagging] product {product_id}: {len(ai_tags)} tags → callback OK")

    except Exception as e:
        print(f"[AI tagging] error for {product_id}: {e}")
