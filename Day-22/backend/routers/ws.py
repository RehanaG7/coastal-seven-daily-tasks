from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from core.websocket_manager import order_ws_manager

router = APIRouter(prefix="/ws", tags=["Real-Time WebSockets"])

CLIENT_HTML = (
    "<!DOCTYPE html><html><head><title>E-Commerce Order Tracker</title>"
    "<style>body{font-family:sans-serif;background:#0f172a;color:#fff;"
    "padding:24px;}"
    ".card{background:#1e293b;border-radius:8px;padding:20px;max-width:600px;"
    "margin:auto;}"
    ".badge{display:inline-block;padding:4px 8px;border-radius:12px;"
    "font-size:12px;font-weight:bold;}"
    ".badge-green{background:#10b981;}"
    ".badge-red{background:#ef4444;}"
    "#logs{background:#0b1120;height:240px;overflow-y:auto;padding:12px;"
    "border-radius:6px;font-family:monospace;font-size:13px;margin-top:14px;}"
    ".log{padding:4px 0;border-bottom:1px solid #1e293b;color:#38bdf8;}"
    "</style></head><body>"
    "<div class=\"card\">"
    "<h2>⚡ Order Status WebSocket Listener</h2>"
    "<p>Status: <span id=\"status\" class=\"badge badge-red\">Offline</span>"
    "</p><div id=\"logs\"></div></div>"
    "<script>"
    "const status = document.getElementById('status');"
    "const logs = document.getElementById('logs');"
    "const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';"
    "const ws = new WebSocket(`${proto}//${location.host}/ws/orders/1`);"
    "function log(m){"
    "const d=document.createElement('div');d.className='log';"
    "const ts=new Date().toLocaleTimeString();"
    "d.textContent=`[${ts}] ${m}`;"
    "logs.prepend(d);}"
    "ws.onopen=()=>{status.textContent='Connected (User 1)';"
    "status.className='badge badge-green';log('Connected to stream');};"
    "ws.onmessage=(e)=>log('🔔 '+e.data);"
    "ws.onclose=()=>{status.textContent='Disconnected';"
    "status.className='badge badge-red';log('Disconnected');};"
    "</script></body></html>"
)


@router.get(
    "/client",
    response_class=HTMLResponse,
    summary="Interactive WebSocket Client",
)
def open_client():
    return HTMLResponse(content=CLIENT_HTML)


@router.websocket("/orders/{user_id}")
async def websocket_order_updates(websocket: WebSocket, user_id: int):
    await order_ws_manager.connect(user_id, websocket)
    await websocket.send_json(
        {"event": "CONNECTED", "message": f"Subscribed for user {user_id}"}
    )
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        order_ws_manager.disconnect(user_id, websocket)
