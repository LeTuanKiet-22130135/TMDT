"""
Local text embedding using sentence-transformers.
Model: intfloat/multilingual-e5-small (~117MB, 384 dims, Vietnamese-capable).
Downloaded once to ~/.cache/huggingface/hub/ on first use.

E5 models require a task prefix:
  "passage: <text>"  — for documents (products)
  "query: <text>"    — for search queries
"""

from typing import List

from sentence_transformers import SentenceTransformer

_MODEL_NAME = "intfloat/multilingual-e5-small"
_embedder: SentenceTransformer | None = None


def _get_embedder() -> SentenceTransformer:
    global _embedder
    if _embedder is None:
        _embedder = SentenceTransformer(_MODEL_NAME, backend="onnx")
    return _embedder


def build_product_text(name: str, description: str | None, tags: List[str]) -> str:
    parts = [name.strip()]
    if description:
        parts.append(description.strip())
    if tags:
        parts.append(" ".join(tags))
    return " | ".join(filter(None, parts))


def embed_product(name: str, description: str | None, tags: List[str]) -> List[float]:
    text = "passage: " + build_product_text(name, description, tags)
    return _get_embedder().encode(text, normalize_embeddings=True).tolist()


def embed_query(query: str) -> List[float]:
    return _get_embedder().encode(f"query: {query}", normalize_embeddings=True).tolist()
