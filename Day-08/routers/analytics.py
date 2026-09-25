import asyncio
import time
from fastapi import APIRouter

router = APIRouter(prefix="/analytics", tags=["Concurrent Analytics"])

async def fetch_product_details(product_id: int):
    await asyncio.sleep(1.0)
    return {"id": product_id, "name": "Mechanical Keyboard", "price": 4500.0}

async def fetch_inventory_status(product_id: int):
    await asyncio.sleep(1.0)
    return {"stock": 42, "warehouse": "Hyderabad-Central"}

async def fetch_review_metrics(product_id: int):
    await asyncio.sleep(1.0)
    return {"rating": 4.8, "total_reviews": 128}

@router.get("/product-summary/{product_id}")
async def get_product_summary(product_id: int):
    start_time = time.time()

    # Runs 3 independent 1-second I/O tasks concurrently
    product, inventory, reviews = await asyncio.gather(
        fetch_product_details(product_id),
        fetch_inventory_status(product_id),
        fetch_review_metrics(product_id)
    )

    elapsed = round(time.time() - start_time, 2)
    return {
        "execution_time_seconds": elapsed,  # ~1.0s, NOT 3.0s
        "product": product,
        "inventory": inventory,
        "reviews": reviews
    }