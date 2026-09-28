from typing import Any, Dict

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse

from core.websocket_manager import ws_manager

router = APIRouter(prefix="/ws", tags=["WebSockets"])

CLIENT_HTML = (
    "<!DOCTYPE html><html><head><title>WebSocket Live Client</title>"
    "<style>body{font-family:sans-serif;background:#0f172a;color:#fff;"
    "padding:20px;}"
    ".card{background:#1e293b;border-radius:8px;padding:20px;max-width:600px;"
    "margin:auto;}"
    ".badge{display:inline-block;padding:4px 8px;border-radius:12px;"
    "font-size:12px;}"
    ".badge-connected{background:#10b981;color:#fff;}"
    ".badge-disconnected{background:#ef4444;color:#fff;}"
    "#logs{background:#0b1120;height:240px;overflow-y:auto;padding:10px;"
    "border-radius:6px;font-family:monospace;font-size:12px;margin-top:12px;}"
    ".log-entry{padding:4px 0;border-bottom:1px solid #1e293b;color:#38bdf8;}"
    "</style></head><body>"
    "<div class=\"card\">"
    "<h2>WebSocket Test Client</h2>"
    "<p>Status: <span id=\"status\" "
    "class=\"badge badge-disconnected\">Offline</span></p>"
    "<div id=\"logs\"></div></div>"
    "<script>"
    "const status = document.getElementById('status');"
    "const logs = document.getElementById('logs');"
    "const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';"
    "const ws = new WebSocket(`${proto}//${location.host}/ws/notifications`);"
    "function log(m){"
    "const d=document.createElement('div');d.className='log-entry';"
    "d.textContent=`[${new Date().toLocaleTimeString()}] ${m}`;logs.prepend(d);}"
    "ws.onopen=()=>{status.textContent='Connected';"
    "status.className='badge badge-connected';};"
    "ws.onmessage=(e)=>log('🔔 '+e.data);"
    "ws.onclose=()=>{status.textContent='Disconnected';"
    "status.className='badge badge-disconnected';};"
    "</script></body></html>"
)


@router.get("/status", summary="Check WebSocket Status")
def websocket_status() -> Dict[str, Any]:
    return {
        "status": "online",
        "websocket_endpoint": "/ws/notifications",
        "protocol": "ws:// or wss://",
        "active_clients_count": len(ws_manager.active_connections),
        "test_client_ui": "/ws/client",
    }


@router.get(
    "/client",
    response_class=HTMLResponse,
    summary="Open Interactive WebSocket Client",
)
def open_client_ui() -> HTMLResponse:
    return HTMLResponse(content=CLIENT_HTML)


@router.websocket("/notifications")
async def websocket_notifications(websocket: WebSocket) -> None:
    await ws_manager.connect(websocket)
    await websocket.send_text("Connected to Real-time Notification Service.")
    try:
        while True:
            data = await websocket.receive_text()
            await ws_manager.broadcast(f"Client broadcast: {data}")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)