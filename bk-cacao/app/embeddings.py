"""
Local text embedding using fastembed (onnxruntime-only, no torch).
Model: sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
  - 384 dims (khớp pgvector schema)
  - ~220MB, multilingual (Vietnamese OK)
  - No task prefix needed (unlike E5)
Downloaded once to ~/.cache/fastembed/ on first use.
"""

from typing import List

from fastembed import TextEmbedding

_MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
_embedder: TextEmbedding | None = None


def _get_embedder() -> TextEmbedding:
    global _embedder
    if _embedder is None:
        _embedder = TextEmbedding(_MODEL_NAME)
    return _embedder


def build_product_text(name: str, description: str | None, tags: List[str]) -> str:
    parts = [name.strip()]
    if description:
        parts.append(description.strip())
    if tags:
        parts.append(" ".join(tags))
    return " | ".join(filter(None, parts))


def embed_product(name: str, description: str | None, tags: List[str]) -> List[float]:
    text = build_product_text(name, description, tags)
    result = list(_get_embedder().embed([text]))
    return result[0].tolist()


def embed_query(query: str) -> List[float]:
    result = list(_get_embedder().embed([query]))
    return result[0].tolist()
