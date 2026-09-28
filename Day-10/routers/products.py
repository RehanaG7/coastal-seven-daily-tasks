import json
import uuid
from pathlib import Path
from typing import Any, List
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError
from sqlalchemy.orm import Session

from core.database import get_db
from core.redis import get_redis_client
from models.product import Product
from models.user import User
from schemas.product import ProductCreate, ProductResponse, ProductUpdate
from routers.auth import get_current_admin

router = APIRouter(prefix="/products", tags=["Products"])

PRODUCT_CACHE_KEY = "products:all"
UPLOAD_DIR = Path("static/products")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.get("", response_model=List[ProductResponse])
def list_products(
    db: Session = Depends(get_db), redis: Any = Depends(get_redis_client)
):
    cached = redis.get(PRODUCT_CACHE_KEY)
    if cached:
        try:
            return json.loads(cached)
        except Exception:
            pass

    products = db.query(Product).all()
    serialized = [
        ProductResponse.model_validate(p).model_dump() for p in products
    ]
    try:
        redis.set(PRODUCT_CACHE_KEY, json.dumps(serialized), ex=60)
    except Exception:
        pass
    return serialized


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )
    return product


@router.post(
    "",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
    redis: Any = Depends(get_redis_client),
):
    product = Product(**product_in.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    redis.delete(PRODUCT_CACHE_KEY)
    return product


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_in: ProductUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
    redis: Any = Depends(get_redis_client),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )
    for field, val in product_in.model_dump(exclude_unset=True).items():
        setattr(product, field, val)
    db.commit()
    db.refresh(product)
    redis.delete(PRODUCT_CACHE_KEY)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
    redis: Any = Depends(get_redis_client),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )
    db.delete(product)
    db.commit()
    redis.delete(PRODUCT_CACHE_KEY)
    return None


@router.post("/{product_id}/upload-image")
async def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
    redis: Any = Depends(get_redis_client),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )

    ext = Path(file.filename or "").suffix.lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image extension",
        )

    filename = f"prod_{product_id}_{uuid.uuid4().hex[:8]}{ext}"
    dest = UPLOAD_DIR / filename
    contents = await file.read()
    dest.write_bytes(contents)

    try:
        with Image.open(dest) as raw:
            raw.verify()
        with Image.open(dest) as img:
            rgb = img.convert("RGB")
            rgb.thumbnail((400, 400))
            rgb.save(dest, "JPEG", quality=85)
    except (UnidentifiedImageError, Exception):
        dest.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Corrupted image file",
        )

    product.image_url = f"/static/products/{filename}"
    db.commit()
    redis.delete(PRODUCT_CACHE_KEY)
    return {
        "message": "Image uploaded successfully",
        "image_url": str(product.image_url),
    }
