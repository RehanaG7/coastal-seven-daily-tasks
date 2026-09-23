import sys
import asyncio

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from fastapi import FastAPI
from app.routers import user_router, product_router
from app.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.include_router(user_router.router)
app.include_router(product_router.router)

@app.get("/health", tags=["System"])
async def health_check():
    return {"status": "healthy", "app": settings.APP_NAME}