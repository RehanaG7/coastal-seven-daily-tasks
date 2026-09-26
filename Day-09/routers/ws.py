from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from core.websocket_manager import ws_manager

router = APIRouter(tags=["WebSockets"])


@router.websocket("/ws/notifications")
async def websocket_notifications(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        await ws_manager.send_personal_message(
            "Connected to Real-time Notification Service.", websocket
        )
        while True:
            # Listen for any client heartbeat / messages
            data = await websocket.receive_text()
            # Echo or broadcast message
            await ws_manager.broadcast(f"Client broadcast: {data}")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
        await ws_manager.broadcast("A client disconnected.")
