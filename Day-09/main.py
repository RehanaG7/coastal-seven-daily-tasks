from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from core.config import STATIC_DIR
from core.database import Base, engine
from routers import uploads, ws

# Create database tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Day 09 - File Uploads, WebSockets & Code Quality",
    version="1.0.0",
)

# Mount static files
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# Routers
app.include_router(uploads.router)
app.include_router(ws.router)


@app.get("/")
def root():
    return {
        "message": "Day 09 API is running",
        "docs": "/docs",
        "ws_endpoint": "/ws/notifications",
        "static_files": "/static/uploads",
    }
