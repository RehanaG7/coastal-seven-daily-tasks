from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.redis import get_redis_client
from core.websocket_manager import order_ws_manager
from models.order import Order, OrderItem
from models.product import Product
from models.user import User
from schemas.order import OrderResponse, OrderStatusUpdate
from routers.auth import get_current_admin, get_current_user
from tasks.email_tasks import send_order_confirmation_email

router = APIRouter(prefix="/orders", tags=["Order Management"])


@router.post(
    "",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
)
def place_order(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    redis: Any = Depends(get_redis_client),
):
    key = f"cart:{current_user.id}"
    cart_items = redis.hgetall(key)
    if not cart_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot place order with an empty cart",
        )

    total_amount = 0.0
    items_to_create = []

    for p_id_str, qty_str in cart_items.items():
        p_id = int(p_id_str)
        qty = int(qty_str)
        product = db.query(Product).filter(Product.id == p_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product #{p_id} not found",
            )
        if int(product.stock) < qty:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for '{product.name}'",
            )

        product.stock = int(product.stock) - qty
        line_total = float(product.price) * qty
        total_amount += line_total
        items_to_create.append(
            OrderItem(
                product_id=int(product.id),
                quantity=qty,
                price_at_purchase=float(product.price),
            )
        )

    order = Order(
        user_id=int(current_user.id),
        total_amount=round(total_amount, 2),
        status="CONFIRMED",
        items=items_to_create,
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    redis.delete(key)

    try:
        send_order_confirmation_email.delay(
            str(current_user.email), int(order.id), float(order.total_amount)
        )
    except Exception:
        pass

    return order


@router.get("", response_model=List[OrderResponse])
def get_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role == "admin":
        return db.query(Order).all()
    return db.query(Order).filter(Order.user_id == current_user.id).all()


@router.patch("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: int,
    status_update: OrderStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Order not found"
        )

    order.status = str(status_update.status)
    db.commit()
    db.refresh(order)

    await order_ws_manager.send_order_update(
        int(order.user_id),
        {
            "event": "ORDER_STATUS_UPDATED",
            "order_id": int(order.id),
            "status": str(order.status),
            "total_amount": float(order.total_amount),
        },
    )
    return order
