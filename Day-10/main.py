import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

try:
    from core.database import Base, engine
except ImportError:
    from database import Base, engine

try:
    from models.product import Product
    from models.user import User
    from models.ecommerce import Order, CartItem, WishlistItem, SupportTicket, Review
except ImportError:
    pass

from routers import auth, products, store

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="Modern Commerce API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(auth.router, prefix="/api/v1")
app.include_router(products.router, prefix="/api/v1/products")
app.include_router(store.router, prefix="/api/v1")

@app.get("/")
def root():
    return {"status": "healthy", "service": "Modern Commerce API"}