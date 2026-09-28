import uuid
from pathlib import Path
from typing import Any, Dict, List

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError

from core.websocket_manager import ws_manager

router = APIRouter(prefix="/uploads", tags=["Uploads"])

UPLOAD_DIR = Path("static/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}
ALLOWED_MIME_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/webp"}

upload_history_db: List[Dict[str, Any]] = []


@router.post(
    "/image",
    status_code=status.HTTP_201_CREATED,
    summary="Upload & Process Image",
)
async def upload_image(file: UploadFile = File(...)) -> Dict[str, Any]:
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Unsupported file extension '{ext}'. Allowed: {ALLOWED_EXTENSIONS}"
            ),
        )

    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid content type '{file.content_type}'. Must be an image.",
        )

    unique_filename = f"{uuid.uuid4().hex}{ext}"
    thumb_filename = f"thumb_{unique_filename}"
    orig_path = UPLOAD_DIR / unique_filename
    thumb_path = UPLOAD_DIR / thumb_filename

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File exceeds maximum allowed size of 5MB.",
        )

    orig_path.write_bytes(contents)
    try:
        with Image.open(orig_path) as raw_img:
            raw_img.verify()

        with Image.open(orig_path) as verify_img:
            processed_img = verify_img.convert("RGB")
            processed_img.thumbnail((300, 300))
            processed_img.save(thumb_path, format="JPEG", quality=85)
    except (UnidentifiedImageError, Exception):
        orig_path.unlink(missing_ok=True)
        thumb_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Corrupted or invalid image file.",
        )

    await ws_manager.broadcast(f"New image uploaded: {file.filename}")

    record = {
        "filename": unique_filename,
        "thumbnail": thumb_filename,
        "original_url": f"/static/uploads/{unique_filename}",
        "thumbnail_url": f"/static/uploads/{thumb_filename}",
    }
    upload_history_db.append(record)

    return record


@router.get("/history", summary="View Upload History")
def get_upload_history() -> List[Dict[str, Any]]:
    return upload_history_db