from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from database import engine
from models.base import Base
import models  # Ensures all models are registered with Base metadata
from routers import auth, projects, tasks

# Automatically create all tables on startup (for initial development before running Alembic)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-ready Task Management REST API with JWT Auth, RBAC, Projects, and Task Lifecycles",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attach routers
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(tasks.router)


@app.get("/", tags=["Health Check"])
def root():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "docs_url": "/docs",
    }