import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.graphql.context import _resolve_current_user
from fastapi import Request

UPLOAD_DIR = Path(__file__).resolve().parents[3] / "uploads"
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_IMAGE_BYTES = 10 * 1024 * 1024   # 10 MB
MAX_FILE_BYTES  = 500 * 1024 * 1024  # 500 MB

router = APIRouter()


async def _save_upload(file: UploadFile, max_bytes: int) -> str:
    data = await file.read()
    if len(data) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large (max {max_bytes // 1024 // 1024} MB)",
        )
    ext = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "bin"
    filename = f"{uuid.uuid4().hex}.{ext}"
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    (UPLOAD_DIR / filename).write_bytes(data)
    return f"/uploads/{filename}"


@router.post("/image")
async def upload_image(
    request: Request,
    file: UploadFile,
    db: Session = Depends(get_db),
) -> dict:
    user = _resolve_current_user(request, db)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported image type")
    url = await _save_upload(file, MAX_IMAGE_BYTES)
    return {"url": url}


@router.post("/file")
async def upload_file(
    request: Request,
    file: UploadFile,
    db: Session = Depends(get_db),
) -> dict:
    """Upload any asset file (PSD, ZIP, moc3, etc.)."""
    user = _resolve_current_user(request, db)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    url = await _save_upload(file, MAX_FILE_BYTES)
    return {"url": url}
