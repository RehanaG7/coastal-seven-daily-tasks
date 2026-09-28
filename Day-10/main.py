from pathlib import Path
from typing import Dict

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from core.config import settings
from core.database import Base, engine
from routers import auth, cart, orders, products, ws

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="E-Commerce backend with Redis, Celery, and WebSockets.",
    version="1.0.0",
)

Path("static/products").mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(products.router, prefix=settings.API_V1_STR)
app.include_router(cart.router, prefix=settings.API_V1_STR)
app.include_router(orders.router, prefix=settings.API_V1_STR)
app.include_router(ws.router)


@app.get("/", tags=["Health"])
def health_check() -> Dict[str, str]:
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "docs": "/docs",
        "websocket_client": "/ws/client",
    }
