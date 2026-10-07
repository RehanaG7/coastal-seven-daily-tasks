from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

try:
    from core.database import get_db
except ImportError:
    from database import get_db

from models.ecommerce import Order, CartItem, WishlistItem, SupportTicket, Review
from core.celery_app import send_order_notification, notify_admin_new_issue

router = APIRouter(prefix="/store", tags=["store"])

class OrderCreate(BaseModel):
    user_email: str
    product_name: str
    price: float
    quantity: int = 1

class StatusUpdate(BaseModel):
    status: str

class CartCreate(BaseModel):
    user_email: str
    product_id: int
    product_name: str
    price: float
    quantity: Optional[int] = 1
    image_url: Optional[str] = None

class CartQuantityUpdate(BaseModel):
    delta: int

class WishlistCreate(BaseModel):
    user_email: str
    product_id: int
    product_name: str
    price: float
    image_url: Optional[str] = None

class TicketCreate(BaseModel):
    user_email: str
    order_id: Optional[int] = None
    subject: str
    message: str

class ReviewCreate(BaseModel):
    product_id: int
    user_email: str
    rating: int
    comment: str

# --- ORDERS & REAL-TIME TRACKING ---
@router.post("/orders", status_code=status.HTTP_201_CREATED)
def place_order(order_in: OrderCreate, db: Session = Depends(get_db)):
    new_order = Order(
        user_email=order_in.user_email,
        product_name=order_in.product_name,
        price=order_in.price,
        quantity=order_in.quantity or 1,
        status="Order Placed"
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    # Celery Background Email Task
    try:
        send_order_notification.delay(
            new_order.user_email,
            new_order.id,
            float(new_order.price * new_order.quantity)
        )
    except Exception as e:
        print(f"[CELERY QUEUE BYPASS]: {e}")

    return new_order

@router.get("/orders")
def get_orders(user_email: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Order)
    if user_email:
        query = query.filter(Order.user_email == user_email)
    return query.order_by(Order.id.desc()).all()

@router.patch("/orders/{order_id}/status")
def update_order_status(order_id: int, update: StatusUpdate, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = update.status
    db.commit()
    return {"message": "Status updated", "status": order.status}

# --- CART WITH QUANTITY STACKING ---
@router.post("/cart")
def add_to_cart(item: CartCreate, db: Session = Depends(get_db)):
    existing = db.query(CartItem).filter(
        CartItem.user_email == item.user_email,
        CartItem.product_id == item.product_id
    ).first()

    if existing:
        existing.quantity = (existing.quantity or 1) + (item.quantity or 1)
        db.commit()
        db.refresh(existing)
        return {"message": "Cart item quantity incremented", "quantity": existing.quantity}

    new_cart_item = CartItem(
        user_email=item.user_email,
        product_id=item.product_id,
        product_name=item.product_name,
        price=item.price,
        quantity=item.quantity or 1,
        image_url=item.image_url
    )
    db.add(new_cart_item)
    db.commit()
    db.refresh(new_cart_item)
    return {"message": "Item added to cart", "quantity": new_cart_item.quantity}

@router.get("/cart")
def get_cart(user_email: str, db: Session = Depends(get_db)):
    return db.query(CartItem).filter(CartItem.user_email == user_email).all()

@router.patch("/cart/{item_id}/quantity")
def update_cart_quantity(item_id: int, payload: CartQuantityUpdate, db: Session = Depends(get_db)):
    item = db.query(CartItem).filter(CartItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    item.quantity = (item.quantity or 1) + payload.delta
    if item.quantity <= 0:
        db.delete(item)
        db.commit()
        return {"action": "deleted"}

    db.commit()
    return {"action": "updated", "quantity": item.quantity}

@router.delete("/cart/{item_id}")
def remove_from_cart(item_id: int, db: Session = Depends(get_db)):
    db.query(CartItem).filter(CartItem.id == item_id).delete()
    db.commit()
    return {"message": "Item removed from cart"}

# --- WISHLIST ---
@router.post("/wishlist")
def toggle_wishlist(item: WishlistCreate, db: Session = Depends(get_db)):
    existing = db.query(WishlistItem).filter(
        WishlistItem.user_email == item.user_email,
        WishlistItem.product_id == item.product_id
    ).first()
    if existing:
        db.delete(existing)
        db.commit()
        return {"action": "removed"}
    new_wish = WishlistItem(**item.model_dump())
    db.add(new_wish)
    db.commit()
    return {"action": "added"}

@router.get("/wishlist")
def get_wishlist(user_email: str, db: Session = Depends(get_db)):
    return db.query(WishlistItem).filter(WishlistItem.user_email == user_email).all()

# --- SUPPORT TICKETS ---
@router.post("/support", status_code=status.HTTP_201_CREATED)
def raise_ticket(ticket_in: TicketCreate, db: Session = Depends(get_db)):
    ticket = SupportTicket(**ticket_in.model_dump())
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    try:
        notify_admin_new_issue.delay(ticket.id, ticket.subject, ticket.user_email)
    except Exception as e:
        print(f"[CELERY QUEUE BYPASS]: {e}")

    return ticket

@router.get("/support")
def get_tickets(user_email: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(SupportTicket)
    if user_email:
        query = query.filter(SupportTicket.user_email == user_email)
    return query.order_by(SupportTicket.id.desc()).all()

@router.patch("/support/{ticket_id}/status")
def update_ticket_status(ticket_id: int, update: StatusUpdate, db: Session = Depends(get_db)):
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket.status = update.status
    db.commit()
    return {"message": "Ticket status updated", "status": ticket.status}

# --- ADMIN METRICS ---
@router.get("/admin/metrics")
def get_admin_metrics(db: Session = Depends(get_db)):
    total_orders = db.query(Order).count()
    active_carts = db.query(CartItem).count()
    open_tickets = db.query(SupportTicket).filter(SupportTicket.status == "Open").count()
    active_customers = db.query(Order.user_email).distinct().count()
    recent_carts = db.query(CartItem).all()
    
    return {
        "total_orders": total_orders,
        "active_carts": active_carts,
        "open_tickets": open_tickets,
        "active_customers": active_customers,
        "recent_carts": recent_carts
    }