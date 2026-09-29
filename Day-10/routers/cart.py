import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import redis.asyncio as aioredis

from core.config import settings
from core.security import get_current_user
from models.user import User

router = APIRouter()

class CartItem(BaseModel):
    product_id: int
    quantity: int

@router.post("/items")
async def add_to_cart(item: CartItem, current_user: User = Depends(get_current_user)):
    r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    cart_key = f"cart:{current_user.id}"
    
    # Fetch existing cart or create empty
    raw_cart = await r.get(cart_key)
    cart = json.loads(raw_cart) if raw_cart else {}
    
    # Update quantity
    str_pid = str(item.product_id)
    cart[str_pid] = cart.get(str_pid, 0) + item.quantity
    
    # Store in Redis with 2-day expiration
    await r.setex(cart_key, 172800, json.dumps(cart))
    await r.close()
    return {"message": "Cart updated", "cart": cart}

@router.get("")
async def get_cart(current_user: User = Depends(get_current_user)):
    r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    cart_key = f"cart:{current_user.id}"
    raw_cart = await r.get(cart_key)
    await r.close()
    return json.loads(raw_cart) if raw_cart else {}

@router.delete("")
async def clear_cart(current_user: User = Depends(get_current_user)):
    r = aioredis.from_url(settings.REDIS_URL)
    await r.delete(f"cart:{current_user.id}")
    await r.close()
    return {"message": "Cart cleared"}