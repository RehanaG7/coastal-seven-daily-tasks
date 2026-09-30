import json
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import redis.asyncio as aioredis

from core.database import get_db
from core.config import settings
from core.security import get_current_user, require_admin
from models.user import User
from models.order import Order, OrderItem
from models.product import Product
from tasks.celery_app import celery_app

router = APIRouter()

class OrderStatusUpdate(BaseModel):
    status: Literal["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]


@router.post("/checkout")
async def checkout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    1. Reads user's Cart from Redis
    2. Validates stock in PostgreSQL & calculates totals
    3. Persists Order & OrderItems in DB
    4. Clears Redis Cart
    5. Hands off fulfillment to background Celery Worker
    """
    r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    cart_key = f"cart:{current_user.id}"
    raw_cart = await r.get(cart_key)
    
    if not raw_cart:
        await r.close()
        raise HTTPException(status_code=400, detail="Your cart is empty")
    
    cart_items = json.loads(raw_cart)
    total_amount = 0.0
    items_to_save = []

    for product_id_str, qty in cart_items.items():
        product = db.query(Product).filter(Product.id == int(product_id_str)).first()
        if not product or product.stock < qty:
            await r.close()
            raise HTTPException(status_code=400, detail=f"Insufficient stock for Product ID: {product_id_str}")
        
        product.stock -= qty
        total_amount += float(product.price) * qty
        items_to_save.append((product.id, qty, product.price))

    # Persist Order in PostgreSQL
    new_order = Order(user_id=current_user.id, total_amount=total_amount, status="PENDING")
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    for pid, qty, price in items_to_save:
        item = OrderItem(order_id=new_order.id, product_id=pid, quantity=qty, price=price)
        db.add(item)
    db.commit()

    # Clear Cart in Redis
    await r.delete(cart_key)
    await r.close()

    # Asynchronously dispatch to Celery background task
    celery_app.send_task("process_order_task", args=[new_order.id])

    return {
        "message": "Order successfully placed. Celery fulfillment started.",
        "order_id": new_order.id,
        "total_amount": total_amount,
        "status": new_order.status,
        "client_websocket": f"/ws/orders/{new_order.id}"
    }


@router.get("/my-orders")
def get_my_orders(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Order).filter(Order.user_id == current_user.id).all()


@router.patch("/{order_id}/status")
async def update_order_status(
    order_id: int,
    payload: OrderStatusUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    """
    Admin-only: Manually update order status and publish event to client WebSocket.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order.status = payload.status
    db.commit()

    # Send update directly to the client's WebSocket channel
    r = aioredis.from_url(settings.REDIS_URL)
    await r.publish(
        f"order_updates_{order_id}",
        json.dumps({
            "order_id": order_id,
            "status": payload.status,
            "message": f"Administrator manually set status to {payload.status}"
        })
    )
    await r.close()
    return {"order_id": order_id, "status": order.status}
