# ==============================================================================
# DAY 17: REAL-TIME WEBSOCKET CONNECTION MANAGER
# Handles concurrent WebSocket client connections for:
# 1. Live Order Fulfillment Tracking (/ws/orders/{order_id})
# 2. Real-Time Admin ↔ Customer Live Support Chat (/ws/chat/{room_id})
# 3. Global System & User Notifications (/ws/notifications)
# ==============================================================================

import asyncio
import json
from datetime import datetime, timezone
from typing import Dict, Set, Any, Optional
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # order_id -> Set[WebSocket]
        self.order_rooms: Dict[int, Set[WebSocket]] = {}
        # room_id -> Set[WebSocket]
        self.chat_rooms: Dict[str, Set[WebSocket]] = {}
        # Admin sockets for presence tracking
        self.admin_sockets: Set[WebSocket] = set()
        self.admin_override: Optional[bool] = None
        # Global notification subscribers
        self.notification_subscribers: Set[WebSocket] = set()

    # --- PRESENCE TRACKING ---
    def register_admin(self, websocket: WebSocket):
        self.admin_sockets.add(websocket)

    def unregister_admin(self, websocket: WebSocket):
        self.admin_sockets.discard(websocket)

    def is_admin_online(self) -> bool:
        if self.admin_override is not None:
            return self.admin_override
        return len(self.admin_sockets) > 0

    def set_admin_override(self, online: bool):
        self.admin_override = online

    # --- ORDER TRACKING ---
    async def connect_order(self, websocket: WebSocket, order_id: int):
        await websocket.accept()
        if order_id not in self.order_rooms:
            self.order_rooms[order_id] = set()
        self.order_rooms[order_id].add(websocket)

    def disconnect_order(self, websocket: WebSocket, order_id: int):
        if order_id in self.order_rooms:
            self.order_rooms[order_id].discard(websocket)
            if not self.order_rooms[order_id]:
                del self.order_rooms[order_id]

    async def broadcast_order_update(self, order_id: int, payload: Dict[str, Any]):
        """Broadcasts live order status transitions to connected customers in real time."""
        if order_id in self.order_rooms:
            dead_sockets = set()
            for ws in list(self.order_rooms[order_id]):
                try:
                    await ws.send_json(payload)
                except Exception:
                    dead_sockets.add(ws)
            for ws in dead_sockets:
                self.order_rooms[order_id].discard(ws)

        # Also send a real-time notification to the global notifications feed
        now_iso = datetime.now(timezone.utc).isoformat()
        notif = {
            "type": "ORDER_STATUS_UPDATE",
            "order_id": order_id,
            "status": payload.get("status"),
            "title": f"Order #{order_id} Updated",
            "message": payload.get("message", f"Order #{order_id} is now {payload.get('status')}"),
            "timestamp": now_iso,
        }
        await self.broadcast_notification(notif)

    # --- LIVE SUPPORT CHAT ---
    async def connect_chat(self, websocket: WebSocket, room_id: str, is_admin: bool = False):
        await websocket.accept()
        if room_id not in self.chat_rooms:
            self.chat_rooms[room_id] = set()
        self.chat_rooms[room_id].add(websocket)
        if is_admin:
            self.register_admin(websocket)

    def disconnect_chat(self, websocket: WebSocket, room_id: str):
        self.unregister_admin(websocket)
        if room_id in self.chat_rooms:
            self.chat_rooms[room_id].discard(websocket)
            if not self.chat_rooms[room_id]:
                del self.chat_rooms[room_id]

    async def broadcast_chat_message(self, room_id: str, message: Dict[str, Any]):
        """Delivers real-time messages between customer and administrator."""
        if room_id in self.chat_rooms:
            dead_sockets = set()
            for ws in list(self.chat_rooms[room_id]):
                try:
                    await ws.send_json(message)
                except Exception:
                    dead_sockets.add(ws)
            for ws in dead_sockets:
                self.chat_rooms[room_id].discard(ws)
                self.unregister_admin(ws)

    async def broadcast_admin_status(self, room_id: str):
        """Broadcasts current admin online/offline status to chat room."""
        await self.broadcast_chat_message(room_id, {
            "type": "ADMIN_STATUS",
            "online": self.is_admin_online(),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

    # --- NOTIFICATIONS PANEL ---
    async def connect_notifications(self, websocket: WebSocket):
        await websocket.accept()
        self.notification_subscribers.add(websocket)

    def disconnect_notifications(self, websocket: WebSocket):
        self.notification_subscribers.discard(websocket)

    async def broadcast_notification(self, notification: Dict[str, Any]):
        """Broadcasts system events, flash sales, low-stock alerts, and order changes."""
        dead_sockets = set()
        for ws in list(self.notification_subscribers):
            try:
                await ws.send_json(notification)
            except Exception:
                dead_sockets.add(ws)
        for ws in dead_sockets:
            self.notification_subscribers.discard(ws)

manager = ConnectionManager()
