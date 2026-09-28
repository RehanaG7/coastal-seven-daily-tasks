from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.redis import get_redis_client
from models.product import Product
from models.user import User
from schemas.cart import CartItemAdd, CartItemDetail, CartResponse
from routers.auth import get_current_user

router = APIRouter(prefix="/cart", tags=["Redis Shopping Cart"])


def cart_key(user_id: int) -> str:
    return f"cart:{user_id}"


@router.get("", response_model=CartResponse)
def view_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    redis: Any = Depends(get_redis_client),
):
    key = cart_key(int(current_user.id))
    cart_data = redis.hgetall(key)
    items = []
    grand_total = 0.0

    if cart_data:
        for p_id_str, qty_str in cart_data.items():
            product = (
                db.query(Product).filter(Product.id == int(p_id_str)).first()
            )
            if product:
                qty = int(qty_str)
                price = float(product.price)
                subtotal = price * qty
                grand_total += subtotal
                items.append(
                    CartItemDetail(
                        product_id=int(product.id),
                        name=str(product.name),
                        price=price,
                        quantity=qty,
                        subtotal=subtotal,
                    )
                )

    return CartResponse(items=items, grand_total=round(grand_total, 2))


@router.post("/items", status_code=status.HTTP_200_OK)
def add_to_cart(
    item_in: CartItemAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    redis: Any = Depends(get_redis_client),
):
    product = (
        db.query(Product).filter(Product.id == item_in.product_id).first()
    )
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
    if int(product.stock) < item_in.quantity:
        detail_msg = f"Stock limit ({product.stock}) exceeded"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail_msg,
        )

    key = cart_key(int(current_user.id))
    existing_qty = redis.hgetall(key).get(str(item_in.product_id))
    new_qty = (int(existing_qty) if existing_qty else 0) + item_in.quantity

    if new_qty > int(product.stock):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Total cart quantity exceeds stock",
        )

    redis.hset(key, str(item_in.product_id), str(new_qty))
    return {
        "message": "Item added to cart",
        "product_id": item_in.product_id,
        "quantity": new_qty,
    }


@router.delete("/items/{product_id}", status_code=status.HTTP_200_OK)
def remove_from_cart(
    product_id: int,
    current_user: User = Depends(get_current_user),
    redis: Any = Depends(get_redis_client),
):
    key = cart_key(int(current_user.id))
    redis.hdel(key, str(product_id))
    return {"message": f"Product {product_id} removed from cart"}


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def clear_cart(
    current_user: User = Depends(get_current_user),
    redis: Any = Depends(get_redis_client),
):
    redis.delete(cart_key(int(current_user.id)))
    return None
