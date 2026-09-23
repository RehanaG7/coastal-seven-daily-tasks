from fastapi import FastAPI
from database import engine, Base
from routers import auth, protected

# Create tables in the database if they do not exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Day 6: Authentication & Security API",
    description="JWT-based authentication with Role-Based Access Control (RBAC)",
    version="1.0.0"
)

# Include our modular route endpoints
app.include_router(auth.router)
app.include_router(protected.router)

@app.get("/")
def root():
    return {"message": "Welcome to Day 6 Auth API! Go to /docs for Swagger UI."}