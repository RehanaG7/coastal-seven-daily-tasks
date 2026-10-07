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
from core.redis import get_async_redis
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
        r = await get_async_redis()
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
    name: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = "No description"
    price: float
    stock: int
    category: Optional[str] = "General"

    def get_name(self) -> str:
        return self.name or self.title or "Unnamed Product"


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    category: Optional[str] = None


class ProductResponse(BaseModel):
    id: int
    name: str
    title: Optional[str] = None
    description: Optional[str] = None
    price: float
    stock: int
    image_url: Optional[str] = None
    category: Optional[str] = "General"

    class Config:
        from_attributes = True


class StockUpdate(BaseModel):
    stock: int


@router.get("", response_model=List[ProductResponse])
@router.get("/", response_model=List[ProductResponse])
async def list_products(
    page: int = 0,
    limit: int = 100,
    skip: Optional[int] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Cache-Aside Pattern: Redis first -> Database fallback with 60s TTL.
    Supports pagination, category filtering, and keyword search.
    """
    is_plain_list = page == 0 and limit >= 50 and skip is None and category is None and search is None
    if is_plain_list:
        r = await get_async_redis()
        cache_key = "products:catalog"
        cached = await r.get(cache_key)
        if cached:
            await r.close()
            return json.loads(cached)

    query = db.query(Product)
    if category and category.lower() != "all":
        query = query.filter(Product.category.ilike(f"%{category}%"))
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))

    offset_val = skip if skip is not None else (page * limit if page > 0 else 0)
    products = query.offset(offset_val).limit(limit).all()

    serialized = [
        {
            "id": p.id,
            "name": p.name,
            "title": p.name,
            "description": p.description or "",
            "price": float(p.price),
            "stock": p.stock,
            "image_url": p.image_url,
            "category": getattr(p, "category", "General") or "General",
        }
        for p in products
    ]

    if is_plain_list:
        r = await get_async_redis()
        await r.setex("products:catalog", 60, json.dumps(serialized))
        await r.close()

    return serialized


@router.patch("/{product_id}/stock", response_model=ProductResponse)
async def patch_product_stock(
    product_id: int,
    payload: StockUpdate,
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.stock = payload.stock
    db.commit()
    db.refresh(product)
    
    try:
        r = await get_async_redis()
        await r.delete("products:catalog")
        await r.close()
    except Exception:
        pass
    return product


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    prod_name = payload.get_name()
    product = Product(
        name=prod_name,
        description=payload.description,
        price=payload.price,
        stock=payload.stock,
        category=payload.category or "General",
        image_url=None,
    )

    db.add(product)
    db.commit()
    db.refresh(product)
    
    # Invalidate Cache
    r = await get_async_redis()
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
    r = await get_async_redis()
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
    r = await get_async_redis()
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
    r = await get_async_redis()
    await r.delete("products:catalog")
    await r.close()

    # Broadcast to Admin WebSocket
    await notify_admin_ws("PRODUCT_DELETED", p_id, p_name)