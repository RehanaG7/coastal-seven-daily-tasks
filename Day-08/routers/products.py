from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel

from core.database import get_db, ProductModel
from services.cache import get_cache, set_cache, invalidate_cache_pattern
from services.rate_limiter import rate_limiter

router = APIRouter(prefix="/products", tags=["Products & Cache-Aside"])

class ProductCreate(BaseModel):
    name: str
    category: str
    price: float

class ProductResponse(BaseModel):
    id: int
    name: str
    category: str
    price: float

    class Config:
        from_attributes = True

@router.get("", dependencies=[Depends(rate_limiter)])
async def get_products(
    category: Optional[str] = Query(None, description="Filter products by category"),
    db: Session = Depends(get_db)
):
    cache_key = f"products:category:{category}" if category else "products:all"
    
    # 1. Check Redis Cache
    cached_data = await get_cache(cache_key)
    if cached_data:
        return {
            "source": "redis_cache",
            "count": len(cached_data),
            "data": cached_data
        }

    # 2. Cache Miss -> Query Real Database (Neon PostgreSQL)
    query = db.query(ProductModel)
    if category:
        query = query.filter(ProductModel.category == category)
    
    records = query.all()
    serialized = [
        {"id": p.id, "name": p.name, "category": p.category, "price": p.price}
        for p in records
    ]

    # 3. Store in Redis with TTL
    await set_cache(cache_key, serialized, ttl=120)

    return {
        "source": "database",
        "count": len(serialized),
        "data": serialized
    }

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    # 1. Insert into Database
    new_product = ProductModel(
        name=product.name,
        category=product.category,
        price=product.price
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    # 2. Invalidate Cache Pattern so next read fetches fresh data
    await invalidate_cache_pattern("products:*")

    return {
        "message": "Product created in database and Redis cache invalidated",
        "product": {
            "id": new_product.id,
            "name": new_product.name,
            "category": new_product.category,
            "price": new_product.price
        }
    }