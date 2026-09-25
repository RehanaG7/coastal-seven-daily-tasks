from fastapi import FastAPI
from core.config import settings
from core.database import Base, engine
from routers import analytics, products, jobs

# Auto-create tables on startup if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.include_router(analytics.router)
app.include_router(products.router)
app.include_router(jobs.router)

@app.get("/")
def root():
    return {"message": "High-Performance API is up and running"}