import json
from pathlib import Path
from typing import List, Optional
from PIL import Image

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
import redis.asyncio as aioredis

from core.database import get_db
from core.config import settings
from core.security import require_admin
from models.user import User
from models.product import Product

router = APIRouter()

# Directory for processed 300x300 images
UPLOAD_DIR = Path("static/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Helper: Notify Admin WebSocket about product modifications
async def notify_admin_ws(event_type: str, product_id: int, product_name: str):
    try:
        r = aioredis.from_url(settings.REDIS_URL, protocol=2)
        payload = json.dumps({
            "event": event_type,
            "product_id": product_id,
            "product_name": product_name
        })
        await r.publish("admin_product_updates", payload)
        await r.close()
    except Exception:
        pass


class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    stock: int


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None


class ProductResponse(BaseModel):
    id: int
    name: str
    description: str
    price: float
    stock: int
    image_url: Optional[str] = None

    class Config:
        from_attributes = True


@router.get("", response_model=List[ProductResponse])
async def list_products(db: Session = Depends(get_db)):
    """
    Cache-Aside Pattern: Redis first -> Database fallback with 60s TTL.
    """
    r = aioredis.from_url(settings.REDIS_URL, decode_responses=True, protocol=2)
    cache_key = "products:catalog"
    cached = await r.get(cache_key)
    
    if cached:
        await r.close()
        return json.loads(cached)
    
    products = db.query(Product).all()
    serialized = [
        {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "price": float(p.price),
            "stock": p.stock,
            "image_url": p.image_url
        }
        for p in products
    ]
    await r.setex(cache_key, 60, json.dumps(serialized))
    await r.close()
    return serialized


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    product = Product(
        name=payload.name,
        description=payload.description,
        price=payload.price,
        stock=payload.stock,
        image_url=None
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    
    # Invalidate Cache
    r = aioredis.from_url(settings.REDIS_URL, protocol=2)
    await r.delete("products:catalog")
    await r.close()

    # Broadcast to Admin WebSocket
    await notify_admin_ws("PRODUCT_CREATED", product.id, product.name)
    return product


@router.post("/{product_id}/upload-image", response_model=ProductResponse)
async def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    """
    Pillow Validation & Resize: Converts any image into a standardized 300x300 PNG.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image")

    filename = f"product_{product_id}.png"
    target_path = UPLOAD_DIR / filename

    try:
        # Validate integrity
        image = Image.open(file.file)
        image.verify()
        
        # Reload and resize to exactly 300x300
        file.file.seek(0)
        image = Image.open(file.file)
        image = image.convert("RGB")
        resized_img = image.resize((300, 300), Image.Resampling.LANCZOS)
        resized_img.save(target_path, format="PNG", quality=90)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image validation/processing failed: {str(e)}")

    # Update database record
    product.image_url = f"/static/uploads/{filename}"
    db.commit()
    db.refresh(product)

    # Invalidate Cache
    r = aioredis.from_url(settings.REDIS_URL, protocol=2)
    await r.delete("products:catalog")
    await r.close()

    # Broadcast to Admin WebSocket
    await notify_admin_ws("PRODUCT_IMAGE_UPDATED", product.id, product.name)
    return product


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, key, value)
    
    db.commit()
    db.refresh(product)
    
    # Invalidate Cache
    r = aioredis.from_url(settings.REDIS_URL, protocol=2)
    await r.delete("products:catalog")
    await r.close()

    # Broadcast to Admin WebSocket
    await notify_admin_ws("PRODUCT_DETAILS_MODIFIED", product.id, product.name)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    p_id = product.id
    p_name = product.name
    db.delete(product)
    db.commit()

    # Invalidate Cache
    r = aioredis.from_url(settings.REDIS_URL, protocol=2)
    await r.delete("products:catalog")
    await r.close()

    # Broadcast to Admin WebSocket
    await notify_admin_ws("PRODUCT_DELETED", p_id, p_name)