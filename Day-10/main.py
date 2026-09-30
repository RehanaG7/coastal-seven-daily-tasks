from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.auth import router as auth_router
from routers.products import router as products_router
from routers.cart import router as cart_router
from routers.orders import router as orders_router
from routers.store import router as store_router
from routers.ws import router as ws_router

app = FastAPI(title="R-Mart Engine", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core R-Mart v1 Endpoints
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(products_router, prefix="/api/v1/products", tags=["Products"])
app.include_router(cart_router, prefix="/api/v1/cart", tags=["Cart"])
app.include_router(orders_router, prefix="/api/v1/orders", tags=["Orders"])
app.include_router(store_router, prefix="/api/v1/store", tags=["Store"])
app.include_router(ws_router, prefix="/api/v1/ws", tags=["WebSocket"])

@app.get("/")
def root():
    return {"brand": "R-Mart", "status": "online", "theme": "black-blue"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000)
