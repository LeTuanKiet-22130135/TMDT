"""MobileNet ONNX tagger for illustration/anime images (DanBooru-style tags)."""
from __future__ import annotations

import json
from pathlib import Path
from typing import NamedTuple

import numpy as np
import onnxruntime as ort
from PIL import Image

MODEL_PATH = Path(__file__).parent / "models/lumine/model.onnx"
TAG_MAPPING_PATH = Path(__file__).parent / "models/lumine/tag_mapping.json"

# Confidence threshold — only tags with prob >= threshold are returned
DEFAULT_THRESHOLD = 0.35
TOP_K = 30  # max tags to return even if all pass threshold

_session: ort.InferenceSession | None = None
_idx2tag: dict[int, str] | None = None


def _get_session() -> ort.InferenceSession:
    global _session
    if _session is None:
        _session = ort.InferenceSession(str(MODEL_PATH), providers=["CPUExecutionProvider"])
    return _session


def _get_idx2tag() -> dict[int, str]:
    global _idx2tag
    if _idx2tag is None:
        mapping: dict[str, int] = json.loads(TAG_MAPPING_PATH.read_text())
        _idx2tag = {v: k for k, v in mapping.items()}
    return _idx2tag


class TagResult(NamedTuple):
    tag: str
    score: float


def preprocess_image(image: Image.Image) -> np.ndarray:
    """Resize to 224×224, normalize to [0,1], return (1, 224, 224, 3) NHWC float32."""
    img = image.convert("RGB").resize((224, 224), Image.BICUBIC)
    arr = np.array(img, dtype=np.float32) / 255.0
    return arr[np.newaxis, ...]  # (1, 224, 224, 3)


def tag_image(image: Image.Image, threshold: float = DEFAULT_THRESHOLD) -> list[TagResult]:
    """Run ONNX inference and return tags with score >= threshold, sorted by score desc."""
    sess = _get_session()
    idx2tag = _get_idx2tag()

    input_name = sess.get_inputs()[0].name
    x = preprocess_image(image)
    (probs,) = sess.run(None, {input_name: x})
    probs = probs[0]  # (8107,)

    results = [
        TagResult(tag=idx2tag[i], score=float(probs[i]))
        for i in range(len(probs))
        if float(probs[i]) >= threshold and i in idx2tag
    ]
    results.sort(key=lambda r: r.score, reverse=True)
    return results[:TOP_K]
