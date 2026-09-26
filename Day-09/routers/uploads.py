import io
import uuid
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from PIL import Image
from sqlalchemy.orm import Session

from core.config import MAX_FILE_SIZE, THUMBNAIL_SIZE, UPLOAD_DIR, settings
from core.database import UploadedFileModel, get_db
from core.websocket_manager import ws_manager

router = APIRouter(prefix="/uploads", tags=["Uploads"])


@router.post("/image", status_code=status.HTTP_201_CREATED)
async def upload_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    # 1. Validate File Extension
    file_ext = Path(file.filename or "").suffix.lower()
    if file_ext not in settings.ALLOWED_EXTENSIONS:
        allowed = ", ".join(settings.ALLOWED_EXTENSIONS)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{file_ext}'. Allowed: {allowed}",
        )

    # 2. Validate MIME Type
    if file.content_type not in settings.ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid content type '{file.content_type}'. Must be an image.",
        )

    # 3. Read content & Validate Size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        max_mb = settings.MAX_FILE_SIZE_MB
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {max_mb}MB.",
        )

    # 4. Pillow Image Verification
    image_obj: Any
    try:
        image_obj = Image.open(io.BytesIO(contents))
        image_obj.verify()
        image_obj = Image.open(io.BytesIO(contents))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Corrupted or invalid image file.",
        )

    # 5. Unique naming & storage
    unique_id = uuid.uuid4().hex[:8]
    base_name = f"{unique_id}_{Path(file.filename or 'file').stem}"
    original_filename = f"{base_name}{file_ext}"
    thumb_filename = f"{base_name}_thumb{file_ext}"

    original_path = UPLOAD_DIR / original_filename
    thumb_path = UPLOAD_DIR / thumb_filename

    with open(original_path, "wb") as f:
        f.write(contents)

    # 6. Resize thumbnail
    if file_ext in {".jpg", ".jpeg"} and image_obj.mode in ("RGBA", "P"):
        image_obj = image_obj.convert("RGB")
    image_obj.thumbnail(THUMBNAIL_SIZE)
    image_obj.save(thumb_path)

    # 7. Persist to Database
    db_record = UploadedFileModel(
        filename=original_filename,
        thumbnail=thumb_filename,
        original_url=f"/static/uploads/{original_filename}",
        thumbnail_url=f"/static/uploads/{thumb_filename}",
        file_size_bytes=len(contents),
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)

    # 8. Real-time WebSocket Broadcast
    await ws_manager.broadcast(
        f"New image uploaded: {original_filename} (Thumbnail: {thumb_filename})"
    )

    return {
        "id": db_record.id,
        "filename": original_filename,
        "thumbnail": thumb_filename,
        "original_url": db_record.original_url,
        "thumbnail_url": db_record.thumbnail_url,
        "size_bytes": db_record.file_size_bytes,
        "uploaded_at": db_record.uploaded_at,
    }


@router.get("/history")
def get_upload_history(db: Session = Depends(get_db)):
    """Retrieve metadata of all uploaded files from DB."""
    return (
        db.query(UploadedFileModel)
        .order_by(UploadedFileModel.uploaded_at.desc())
        .all()
    )
