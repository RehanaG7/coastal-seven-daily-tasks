from fastapi import FastAPI
from routers.analytics import router as analytics_router
from routers.products import router as products_router
from routers.jobs import router as jobs_router

app = FastAPI(
    title="Day 8: High-Performance Async, Caching & Distributed Systems",
    description="Professional modular architecture demonstrating asyncio.gather, Redis Cache-Aside, Sliding-Window Rate Limiting, and Celery background workers.",
    version="1.0.0"
)

app.include_router(analytics_router)
app.include_router(products_router)
app.include_router(jobs_router)

@app.get("/", tags=["Health"])
async def root():
    return {"status": "online", "architecture": "Enterprise Modular", "day": "Day 8"}