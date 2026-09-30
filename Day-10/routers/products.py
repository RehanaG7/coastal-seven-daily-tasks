import os
import shutil
import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session

try:
    from core.database import get_db
except ImportError:
    from database import get_db

try:
    from models.product import Product
except ImportError:
    from models import Product

try:
    from core.celery_app import process_image_upload
except Exception:
    def process_image_upload(*args, **kwargs):
        pass

router = APIRouter(tags=["products"])

UPLOAD_DIR = os.path.join("static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

class ProductOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = ""
    price: float
    stock: int
    image_url: Optional[str] = None

    class Config:
        from_attributes = True

@router.get("", response_model=List[ProductOut])
@router.get("/", response_model=List[ProductOut])
def list_products(db: Session = Depends(get_db)):
    products = db.query(Product).all()
    result = []
    for p in products:
        result.append({
            "id": p.id,
            "name": p.name,
            "description": p.description or "",
            "price": float(p.price) if p.price is not None else 0.0,
            "stock": int(p.stock) if p.stock is not None else 0,
            "image_url": getattr(p, "image_url", None)
        })
    return result

@router.get("/{product_id}", response_model=ProductOut)
def get_product_by_id(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return {
        "id": product.id,
        "name": product.name,
        "description": product.description or "",
        "price": float(product.price) if product.price is not None else 0.0,
        "stock": int(product.stock) if product.stock is not None else 0,
        "image_url": getattr(product, "image_url", None)
    }

@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_product(
    name: str = Form(...),
    description: str = Form(...),
    price: float = Form(...),
    stock: int = Form(...),
    image_url: Optional[str] = Form(None),
    image_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    final_image_url = image_url

    if image_file and image_file.filename:
        ext = os.path.splitext(image_file.filename)[1]
        unique_name = f"{uuid.uuid4().hex}{ext}"
        saved_path = os.path.join(UPLOAD_DIR, unique_name)

        with open(saved_path, "wb") as buffer:
            shutil.copyfileobj(image_file.file, buffer)

        final_image_url = f"http://127.0.0.1:8000/static/uploads/{unique_name}"

        try:
            process_image_upload.delay(saved_path)
        except Exception as e:
            print(f"[CELERY WORKER BYPASS]: {e}")

    new_prod = Product(
        name=name,
        description=description,
        price=price,
        stock=stock,
        image_url=final_image_url
    )
    db.add(new_prod)
    db.commit()
    db.refresh(new_prod)
    return new_prod

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return None