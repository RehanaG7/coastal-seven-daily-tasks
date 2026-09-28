from pathlib import Path
from typing import Dict

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from routers import uploads, ws

app = FastAPI(
    title="Day 09 - File Uploads & WebSockets",
    description="File upload pipeline and real-time WebSocket notifications.",
    version="1.0.0",
)

Path("static/uploads").mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(uploads.router)
app.include_router(ws.router)


@app.get("/")
def root() -> Dict[str, str]:
    return {"message": "Day 09 API is running"}