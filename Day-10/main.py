from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.auth import router as auth_router
from routers.products import router as products_router
from routers.orders import router as orders_router

app = FastAPI(title="R-Mart Enterprise API", version="1.0.0")

# Enable CORS for frontend Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root sanity check
@app.get("/")
def root():
    return {"message": "R-Mart API is running cleanly"}

# Mount all routers cleanly under /api/v1
# Note: routers/products.py has prefix="/products", so mounting it at prefix="/api/v1" makes: /api/v1/products
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(products_router, prefix="/api/v1")
app.include_router(orders_router, prefix="/api/v1/orders", tags=["Orders"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
