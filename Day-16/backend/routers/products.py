from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, List

router = APIRouter(prefix="/products", tags=["Products"])

PRODUCTS_DB = [
    {
        "id": "p-1",
        "title": "Mechanical RGB Gaming Keyboard",
        "price": 89.99,
        "category": "Electronics",
        "stock": 0,  # < 5 Red Stockout
        "image_url": "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=600&q=80",
        "description": "Hot-swappable switches with dynamic RGB backlighting and braided USB-C cable."
    },
    {
        "id": "p-2",
        "title": "Ultra-Lightweight Ergonomic Mouse",
        "price": 49.99,
        "category": "Peripherals",
        "stock": 3,  # < 5 Red Stockout
        "image_url": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=600&q=80",
        "description": "26,000 DPI sensor, honeycomb lightweight frame."
    },
    {
        "id": "p-3",
        "title": "Nebula Pro Wireless Gaming Headset",
        "price": 119.99,
        "category": "Electronics",
        "stock": 15,
        "image_url": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80",
        "description": "Ultra-low latency 2.4GHz wireless headset with active noise cancellation."
    },
    {
        "id": "p-4",
        "title": "Smart Stainless Steel Hydration Flask",
        "price": 34.99,
        "category": "Accessories",
        "stock": 35,
        "image_url": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80",
        "description": "Double-walled vacuum insulated flask with LED temperature display cap."
    },
    {
        "id": "p-5",
        "title": "Curved Ultra-Wide Gaming Monitor 34\"",
        "price": 399.99,
        "category": "Electronics",
        "stock": 2,  # < 5 Red Stockout
        "image_url": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80",
        "description": "144Hz 1ms curved gaming display with HDR10."
    },
    {
        "id": "p-6",
        "title": "Thunderbolt 4 Workstation Docking Station",
        "price": 129.99,
        "category": "Accessories",
        "stock": 12,
        "image_url": "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=600&q=80",
        "description": "Multi-port 100W PD charging dock for dual 4K monitors."
    },
    {
        "id": "p-7",
        "title": "Streamer Studio Condenser USB Microphone",
        "price": 79.99,
        "category": "Peripherals",
        "stock": 1,  # < 5 Red Stockout
        "image_url": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80",
        "description": "Cardioid pickup pattern with built-in pop filter and zero-latency monitoring."
    },
    {
        "id": "p-8",
        "title": "Ergonomic Memory Foam Lumbar Cushion",
        "price": 29.99,
        "category": "Accessories",
        "stock": 24,
        "image_url": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80",
        "description": "High-density orthopedic posture support for desk chairs."
    }
]

class ProductCreate(BaseModel):
    title: str = Field(..., example="Wireless Earbuds")
    price: float = Field(..., gt=0, example=59.99)
    category: Optional[str] = Field("Electronics")
    stock: int = Field(10, ge=0)
    image_url: Optional[str] = None
    description: Optional[str] = None

class StockUpdate(BaseModel):
    stock: int = Field(..., ge=0)

@router.get("", response_model=List[dict])
def get_products(category: Optional[str] = None):
    if category and category.lower() != "all":
        return [p for p in PRODUCTS_DB if p.get("category", "").lower() == category.lower()]
    return PRODUCTS_DB

@router.get("/{product_id}")
def get_product(product_id: str):
    product = next((p for p in PRODUCTS_DB if str(p["id"]) == str(product_id)), None)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product

@router.post("", status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate):
    new_product = {
        "id": f"p-{len(PRODUCTS_DB) + 1}",
        "title": payload.title,
        "price": float(payload.price),
        "category": payload.category or "General",
        "stock": int(payload.stock),
        "image_url": payload.image_url or "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80",
        "description": payload.description or "Verified authentic R-Mart product."
    }
    PRODUCTS_DB.insert(0, new_product)
    return {"status": "success", "product": new_product}

@router.patch("/{product_id}/stock")
def update_stock(product_id: str, payload: StockUpdate):
    product = next((p for p in PRODUCTS_DB if str(p["id"]) == str(product_id)), None)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    product["stock"] = payload.stock
    return {"status": "success", "product": product}

@router.delete("/{product_id}")
def delete_product(product_id: str):
    global PRODUCTS_DB
    product = next((p for p in PRODUCTS_DB if str(p["id"]) == str(product_id)), None)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    PRODUCTS_DB = [p for p in PRODUCTS_DB if str(p["id"]) != str(product_id)]
    return {"status": "success", "message": f"Deleted product {product_id}"}
