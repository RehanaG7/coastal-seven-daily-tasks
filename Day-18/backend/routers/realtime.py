# ==============================================================================
# DAY 17: REAL-TIME WEBSOCKET ROUTER (CHAT, ORDERS & NOTIFICATIONS)
# Features:
# - Bidirectional Admin <-> Customer Live Support Chat
# - Instant Automated Concierge / Admin Reply on Customer Messages
# - Real-Time Admin Online / Offline Presence Tracking
# - Live Order Status Update Streaming
# - System Event & Flash Sale Broadcasts
# ==============================================================================

import asyncio
import json
import time
from datetime import datetime, timezone
from typing import List, Optional, Any, Union
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from core.database import get_db
from core.websocket_manager import manager
from models.ecommerce import ChatMessage, Notification
from models.user import User

router = APIRouter()

# --- HELPER FUNCTION: INTELLIGENT SUPPORT BOT REPLIES ---
def generate_support_reply(query: str, sender_name: str) -> str:
    """Generates intelligent customer support replies based on customer inquiry."""
    q = query.lower()
    if any(w in q for w in ["order", "track", "delivery", "shipping", "courier", "status", "where is"]):
        return f"Hello {sender_name}, your order is tracked live with GPS hub dispatch. You can view exact real-time dispatch coordinates directly on your Orders page!"
    if any(w in q for w in ["refund", "cancel", "return", "money", "payment", "card"]):
        return "Our refund pipeline is fully automated. Eligible returns are credited to your original payment method within 2 to 4 hours."
    if any(w in q for w in ["discount", "coupon", "code", "offer", "sale", "deal"]):
        return "You can use code RMARTVIP at checkout to receive complimentary priority shipping across all catalog categories!"
    if any(w in q for w in ["warranty", "guarantee", "replace", "defect", "damage"]):
        return "All R-Mart products come with a 1-year brand warranty and a 7-day hassle-free doorstep replacement guarantee."
    if any(w in q for w in ["hi", "hello", "hey", "help", "support"]):
        return f"Hello {sender_name}! Welcome to R-Mart Concierge. I've logged your request: \"{query}\". How can our team assist you today?"
    return f"Thank you for contacting R-Mart Support! We have received your query: \"{query}\". A support specialist is reviewing your inquiry right now."

# --- PYDANTIC SCHEMAS ---

class ChatMessageCreate(BaseModel):
    room_id: str = "general"
    sender_name: str = "Customer"
    sender_role: str = "customer" # "customer" | "admin" | "system"
    text: str
    client_id: Optional[str] = None

class ChatMessageResponse(BaseModel):
    id: int
    room_id: str
    sender_name: str
    sender_role: str
    text: str
    timestamp: Any

    class Config:
        from_attributes = True

class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    category: str
    is_read: int
    created_at: str

    class Config:
        from_attributes = True

class AdminStatusPayload(BaseModel):
    online: bool

# --- REST ENDPOINTS (CHAT & NOTIFICATIONS) ---

@router.get("/chat/admin-status")
def get_admin_status():
    """Returns whether support administrators are currently online."""
    return {"online": manager.is_admin_online()}

@router.post("/chat/admin-status")
async def set_admin_status(payload: AdminStatusPayload):
    """Sets administrative presence status and broadcasts to chat rooms."""
    manager.set_admin_override(payload.online)
    await manager.broadcast_chat_message("general", {
        "type": "ADMIN_STATUS",
        "online": payload.online,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    return {"status": "updated", "online": payload.online}

@router.get("/chat/history/{room_id}", response_model=List[ChatMessageResponse])
def get_chat_history(room_id: str, db: Session = Depends(get_db)):
    """Fetches recent chat history for a customer/admin support room."""
    msgs = (
        db.query(ChatMessage)
        .filter(ChatMessage.room_id == room_id)
        .order_by(ChatMessage.id.asc())
        .limit(100)
        .all()
    )
    return [
        ChatMessageResponse(
            id=m.id,
            room_id=m.room_id,
            sender_name=m.sender_name,
            sender_role=m.sender_role,
            text=m.text,
            timestamp=m.timestamp.isoformat() if m.timestamp else datetime.now(timezone.utc).isoformat(),
        )
        for m in msgs
    ]

@router.post("/chat/message", response_model=ChatMessageResponse)
async def post_chat_message(payload: ChatMessageCreate, db: Session = Depends(get_db)):
    """Posts a message via REST, stores in SQLite, and broadcasts via WebSockets."""
    now = datetime.now(timezone.utc)
    msg = ChatMessage(
        room_id=payload.room_id,
        sender_name=payload.sender_name,
        sender_role=payload.sender_role,
        text=payload.text,
        timestamp=now,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    resp_data = {
        "id": msg.id,
        "room_id": msg.room_id,
        "sender_name": msg.sender_name,
        "sender_role": msg.sender_role,
        "text": msg.text,
        "client_id": payload.client_id,
        "timestamp": msg.timestamp.isoformat(),
    }

    # Broadcast to live WebSocket connections
    await manager.broadcast_chat_message(payload.room_id, {
        "type": "CHAT_MESSAGE",
        **resp_data,
    })

    # If customer message, send automated concierge reply & broadcast alert to Admin
    if payload.sender_role == "customer":
        try:
            await manager.broadcast_notification({
                "id": int(time.time()),
                "title": f"💬 New Query from {payload.sender_name}",
                "message": payload.text[:80] + ("..." if len(payload.text) > 80 else ""),
                "category": "support",
                "room_id": payload.room_id,
            })
        except Exception:
            pass

        reply_text = generate_support_reply(payload.text, payload.sender_name)
        reply_record = ChatMessage(
            room_id=payload.room_id,
            sender_name="Admin Support" if manager.is_admin_online() else "R-Mart Concierge",
            sender_role="admin",
            text=reply_text,
            timestamp=datetime.now(timezone.utc),
        )
        db.add(reply_record)
        db.commit()
        db.refresh(reply_record)

        await manager.broadcast_chat_message(payload.room_id, {
            "type": "CHAT_MESSAGE",
            "id": reply_record.id,
            "room_id": payload.room_id,
            "sender_name": reply_record.sender_name,
            "sender_role": "admin",
            "text": reply_text,
            "timestamp": reply_record.timestamp.isoformat(),
        })

    return ChatMessageResponse(
        id=msg.id,
        room_id=msg.room_id,
        sender_name=msg.sender_name,
        sender_role=msg.sender_role,
        text=msg.text,
        timestamp=msg.timestamp.isoformat() if hasattr(msg.timestamp, "isoformat") else str(msg.timestamp),
    )

@router.get("/notifications", response_model=List[NotificationResponse])
def get_notifications(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Retrieves notifications for the current user or global notifications."""
    query = db.query(Notification)
    if user_id:
        query = query.filter((Notification.user_id == user_id) | (Notification.user_id == None))
    else:
        query = query.filter(Notification.user_id == None)
    
    notifs = query.order_by(Notification.id.desc()).limit(50).all()
    return [
        NotificationResponse(
            id=n.id,
            title=n.title,
            message=n.message,
            category=n.category,
            is_read=n.is_read,
            created_at=n.created_at.isoformat() if n.created_at else datetime.now(timezone.utc).isoformat(),
        )
        for n in notifs
    ]

@router.post("/notifications/{notification_id}/read")
def mark_notification_read(notification_id: int, db: Session = Depends(get_db)):
    """Marks a notification as read."""
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = 1
    db.commit()
    return {"status": "success", "id": notification_id, "is_read": 1}

class BroadcastPayload(BaseModel):
    title: str = "Announcement"
    message: str = "Special announcement from R-Mart"
    category: str = "promo"

@router.post("/notifications/broadcast")
async def broadcast_notification_event(
    payload: Optional[BroadcastPayload] = None,
    title: Optional[str] = Query(None, description="Notification headline"),
    message: Optional[str] = Query(None, description="Body of the notification"),
    category: Optional[str] = Query(None, description="Category: promo | order | stock | alert"),
    db: Session = Depends(get_db)
):
    """Admin triggers an instantaneous broadcast to all active clients via WebSockets."""
    notif_title = (payload.title if payload else None) or title or "Alert"
    notif_msg = (payload.message if payload else None) or message or "Notice"
    notif_cat = (payload.category if payload else None) or category or "promo"

    now = datetime.now(timezone.utc)
    notif = Notification(
        title=notif_title,
        message=notif_msg,
        category=notif_cat,
        is_read=0,
        created_at=now,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)

    data = {
        "id": notif.id,
        "type": "ANNOUNCEMENT",
        "title": notif_title,
        "message": notif_msg,
        "category": notif_cat,
        "timestamp": now.isoformat(),
    }
    await manager.broadcast_notification(data)
    return {"status": "broadcasted", "notification": data}

# --- WEBSOCKET ENDPOINTS ---

@router.websocket("/ws/orders/{order_id}")
async def ws_order_updates(websocket: WebSocket, order_id: int):
    """
    Live Order Updates: Connects client to real-time status transitions.
    Sends initial confirmation and listens for live updates.
    """
    now = datetime.now(timezone.utc)
    await manager.connect_order(websocket, order_id)
    try:
        await websocket.send_json({
            "type": "CONNECTED",
            "event": "CONNECTED",
            "order_id": order_id,
            "message": f"Subscribed: Tracking started for Order #{order_id}",
            "timestamp": now.isoformat(),
        })
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
                if data.get("type") == "PING":
                    await websocket.send_json({"type": "PONG", "timestamp": datetime.now(timezone.utc).isoformat()})
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect_order(websocket, order_id)

@router.websocket("/ws/chat/{room_id}")
async def ws_live_support_chat(
    websocket: WebSocket,
    room_id: str,
    role: str = Query("customer"),
    db: Session = Depends(get_db)
):
    """
    Admin ↔ Customer Live Chat: Real-time messaging between users and support staff.
    Includes presence detection and automated concierge assistant replies.
    """
    is_admin = (role == "admin")
    await manager.connect_chat(websocket, room_id, is_admin=is_admin)
    try:
        now = datetime.now(timezone.utc)
        await websocket.send_json({
            "type": "CONNECTED",
            "room_id": room_id,
            "message": f"Connected to Live Support Room: {room_id}",
            "admin_online": manager.is_admin_online(),
            "timestamp": now.isoformat(),
        })

        # If admin just connected, notify everyone in the room
        if is_admin:
            await manager.broadcast_admin_status(room_id)

        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
                msg_type = data.get("type", "CHAT_MESSAGE")

                if msg_type == "PING":
                    await websocket.send_json({"type": "PONG"})
                    continue

                if msg_type == "ADMIN_STATUS_UPDATE":
                    manager.set_admin_override(data.get("online", True))
                    await manager.broadcast_admin_status(room_id)
                    continue

                if msg_type == "TYPING":
                    # Broadcast typing indicator to all participants in this room
                    await manager.broadcast_chat_message(room_id, {
                        "type": "TYPING",
                        "user": data.get("user", "Agent"),
                        "room_id": room_id,
                    })
                    continue

                # Standard chat message: save to database and broadcast
                text = data.get("text", "")
                if text.strip():
                    sender_name = data.get("sender_name", "Customer")
                    sender_role = data.get("sender_role", "customer")
                    client_id = data.get("client_id")

                    chat_record = ChatMessage(
                        room_id=room_id,
                        sender_name=sender_name,
                        sender_role=sender_role,
                        text=text,
                        timestamp=datetime.now(timezone.utc),
                    )
                    db.add(chat_record)
                    db.commit()
                    db.refresh(chat_record)

                    out_msg = {
                        "type": "CHAT_MESSAGE",
                        "id": chat_record.id,
                        "room_id": room_id,
                        "sender_name": sender_name,
                        "sender_role": sender_role,
                        "text": text,
                        "client_id": client_id,
                        "timestamp": chat_record.timestamp.isoformat(),
                    }
                    await manager.broadcast_chat_message(room_id, out_msg)

                    # If customer sent the message, trigger instant concierge reply
                    if sender_role == "customer":
                        # Broadcast notification alert to Admin
                        try:
                            await manager.broadcast_notification({
                                "id": int(time.time()),
                                "title": f"💬 New Query from {sender_name}",
                                "message": f"{text[:80]}",
                                "category": "support",
                                "room_id": room_id,
                            })
                        except Exception:
                            pass

                        # Send typing indicator first
                        await manager.broadcast_chat_message(room_id, {
                            "type": "TYPING",
                            "user": "Support Team",
                            "room_id": room_id,
                        })

                        # Wait brief moment for realistic responsiveness
                        await asyncio.sleep(0.8)

                        reply_text = generate_support_reply(text, sender_name)
                        reply_record = ChatMessage(
                            room_id=room_id,
                            sender_name="Admin Support" if manager.is_admin_online() else "R-Mart Concierge",
                            sender_role="admin",
                            text=reply_text,
                            timestamp=datetime.now(timezone.utc),
                        )
                        db.add(reply_record)
                        db.commit()
                        db.refresh(reply_record)

                        await manager.broadcast_chat_message(room_id, {
                            "type": "CHAT_MESSAGE",
                            "id": reply_record.id,
                            "room_id": room_id,
                            "sender_name": reply_record.sender_name,
                            "sender_role": "admin",
                            "text": reply_text,
                            "timestamp": reply_record.timestamp.isoformat(),
                        })

            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect_chat(websocket, room_id)
        if is_admin:
            await manager.broadcast_admin_status(room_id)

@router.websocket("/ws/notifications")
async def ws_global_notifications(websocket: WebSocket):
    """
    Real-Time Notifications: Broadcasts live system events, order changes & announcements.
    """
    await manager.connect_notifications(websocket)
    try:
        now = datetime.now(timezone.utc)
        await websocket.send_json({
            "type": "CONNECTED",
            "message": "Connected to real-time notifications stream",
            "timestamp": now.isoformat(),
        })
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
                if data.get("type") == "PING":
                    await websocket.send_json({"type": "PONG"})
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect_notifications(websocket)
