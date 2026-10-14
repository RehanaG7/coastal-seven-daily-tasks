import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from core.database import get_db
from core.redis import get_async_redis
from core.security import get_current_user
from models.user import User
from models.product import Product

router = APIRouter()


class CartItem(BaseModel):
    product_id: int
    quantity: int


@router.post("/items")
async def add_to_cart(
    item: CartItem,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = db.query(Product).filter(Product.id == item.product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )

    r = await get_async_redis()
    cart_key = f"cart:{current_user.id}"

    raw_cart = await r.get(cart_key)
    cart = json.loads(raw_cart) if raw_cart else {}

    str_pid = str(item.product_id)
    current_qty = cart.get(str_pid, 0)
    new_qty = current_qty + item.quantity

    if item.quantity <= 0 or new_qty > product.stock:
        await r.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient stock or invalid quantity",
        )

    cart[str_pid] = new_qty
    await r.setex(cart_key, 172800, json.dumps(cart))
    await r.close()
    return {"message": "Cart updated", "cart": cart}


@router.get("")
async def get_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    r = await get_async_redis()
    cart_key = f"cart:{current_user.id}"
    raw_cart = await r.get(cart_key)
    await r.close()

    if not raw_cart:
        return {"items": [], "grand_total": 0.0}

    cart = json.loads(raw_cart)
    items_list = []
    grand_total = 0.0

    for pid_str, qty in cart.items():
        p = db.query(Product).filter(Product.id == int(pid_str)).first()
        if p:
            subtotal = float(p.price) * qty
            grand_total += subtotal
            items_list.append(
                {
                    "product_id": p.id,
                    "name": p.name,
                    "price": float(p.price),
                    "quantity": qty,
                    "subtotal": subtotal,
                    "image_url": p.image_url,
                }
            )

    return {"items": items_list, "grand_total": round(grand_total, 2)}


@router.delete("/items/{product_id}")
async def remove_cart_item(
    product_id: int,
    current_user: User = Depends(get_current_user),
):
    r = await get_async_redis()
    cart_key = f"cart:{current_user.id}"
    raw_cart = await r.get(cart_key)

    if raw_cart:
        cart = json.loads(raw_cart)
        str_pid = str(product_id)
        if str_pid in cart:
            del cart[str_pid]
            await r.setex(cart_key, 172800, json.dumps(cart))

    await r.close()
    return {"message": "Item removed from cart"}


@router.delete("")
async def clear_cart(current_user: User = Depends(get_current_user)):
    r = await get_async_redis()
    await r.delete(f"cart:{current_user.id}")
    await r.close()
    return {"message": "Cart cleared"}