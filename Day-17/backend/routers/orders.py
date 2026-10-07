import json
from typing import List, Literal, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from core.database import get_db
from core.redis import get_async_redis
from core.security import get_current_user, require_admin
from models.user import User
from models.order import Order, OrderItem
from models.product import Product
from tasks.celery_app import celery_app
from core.websocket_manager import manager

router = APIRouter()


class OrderStatusUpdate(BaseModel):
    status: Literal["PENDING", "PROCESSING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"]


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    price_at_purchase: float

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: int
    user_id: int
    total_amount: float
    status: str
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True


@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/checkout", status_code=status.HTTP_201_CREATED)
async def checkout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    1. Reads user's Cart from Redis
    2. Validates stock in DB & calculates totals
    3. Persists Order & OrderItems in DB and deducts stock
    4. Clears Redis Cart
    5. Hands off fulfillment to background Celery Worker
    """
    r = await get_async_redis()
    cart_key = f"cart:{current_user.id}"
    raw_cart = await r.get(cart_key)

    if not raw_cart:
        await r.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your cart is empty",
        )

    cart_items = json.loads(raw_cart)
    if not cart_items:
        await r.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your cart is empty",
        )

    total_amount = 0.0
    items_to_save = []

    for product_id_str, qty in cart_items.items():
        product = (
            db.query(Product).filter(Product.id == int(product_id_str)).first()
        )
        if not product or product.stock < qty:
            await r.close()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for Product ID: {product_id_str}",
            )

        product.stock -= qty
        total_amount += float(product.price) * qty
        items_to_save.append((product.id, qty, product.price))

    # Persist Order in DB
    new_order = Order(
        user_id=current_user.id,
        total_amount=round(total_amount, 2),
        status="CONFIRMED",
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    for pid, qty, price in items_to_save:
        item = OrderItem(
            order_id=new_order.id,
            product_id=pid,
            quantity=qty,
            price_at_purchase=price,
        )
        db.add(item)
    db.commit()

    # Clear Cart in Redis
    await r.delete(cart_key)
    await r.close()

    # Asynchronously dispatch to Celery background task if broker reachable
    try:
        celery_app.send_task("process_order_task", args=[new_order.id])
    except Exception:
        pass

    return {
        "id": new_order.id,
        "message": "Order successfully placed. Celery fulfillment started.",
        "order_id": new_order.id,
        "total_amount": new_order.total_amount,
        "status": new_order.status,
        "client_websocket": f"/ws/orders/{new_order.id}",
    }


@router.get("")
@router.get("/my-orders")
def get_my_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    orders = db.query(Order).filter(Order.user_id == current_user.id).all()
    result = []
    for o in orders:
        result.append(
            {
                "id": o.id,
                "order_id": o.id,
                "user_id": o.user_id,
                "total_amount": float(o.total_amount),
                "status": o.status,
                "items": [
                    {
                        "id": it.id,
                        "product_id": it.product_id,
                        "quantity": it.quantity,
                        "price": float(getattr(it, "price_at_purchase", 0.0)),
                        "price_at_purchase": float(getattr(it, "price_at_purchase", 0.0)),
                    }
                    for it in o.items
                ],
            }
        )
    return result


@router.patch("/{order_id}/status")
async def update_order_status(
    order_id: int,
    payload: OrderStatusUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """
    Admin-only: Manually update order status and publish event to client WebSocket.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Order not found"
        )

    order.status = payload.status
    db.commit()

    # Send update directly to WebSocket clients via ConnectionManager
    try:
        await manager.broadcast_order_update(
            order_id,
            {
                "type": "ORDER_STATUS_UPDATE",
                "order_id": order_id,
                "status": payload.status,
                "message": f"Administrator manually set status to {payload.status}",
            },
        )
    except Exception:
        pass

    # Send update to Redis pubsub if available
    try:
        r = await get_async_redis()
        await r.publish(
            f"order_updates_{order_id}",
            json.dumps(
                {
                    "order_id": order_id,
                    "status": payload.status,
                    "message": f"Administrator manually set status to {payload.status}",
                }
            ),
        )
        await r.close()
    except Exception:
        pass

    return {"order_id": order_id, "status": order.status}