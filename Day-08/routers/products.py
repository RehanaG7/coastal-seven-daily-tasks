from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field
from typing import Optional
from services.cache import get_cache, set_cache, invalidate_cache_pattern
from services.rate_limiter import rate_limiter

router = APIRouter(prefix="/products", tags=["Products & Caching"])

# Mock database simulating PostgreSQL
PRODUCTS_DB = [
    {"id": 1, "name": "Mechanical Keyboard", "category": "electronics", "price": 4500},
    {"id": 2, "name": "Wireless Mouse", "category": "electronics", "price": 1200},
    {"id": 3, "name": "Notebook Stand", "category": "office", "price": 850},
]

class ProductCreate(BaseModel):
    name: str = Field(..., min_length=2)
    category: str
    price: float = Field(..., gt=0)

# GET endpoint uses sliding-window rate limit and Cache-Aside
@router.get("", dependencies=[Depends(rate_limiter)])
async def list_products(category: Optional[str] = None):
    cache_key = f"products:{category.lower() if category else 'all'}"

    # 1. Check Redis cache first
    cached_data = await get_cache(cache_key)
    if cached_data is not None:
        return {"source": "redis_cache", "data": cached_data}

    # 2. Cache miss: Read from database
    if category:
        items = [p for p in PRODUCTS_DB if p["category"].lower() == category.lower()]
    else:
        items = PRODUCTS_DB

    # 3. Store in Redis with TTL
    await set_cache(cache_key, items, ttl=120)
    return {"source": "database", "data": items}

# POST endpoint invalidates Redis cache so stale data is never served
@router.post("", status_code=status.HTTP_201_CREATED)
async def create_product(payload: ProductCreate):
    new_id = len(PRODUCTS_DB) + 1
    new_item = {"id": new_id, **payload.model_dump()}
    PRODUCTS_DB.append(new_item)

    # Invalidate stale cache
    await invalidate_cache_pattern("products:*")

    return {"message": "Product created and cache invalidated", "item": new_item}