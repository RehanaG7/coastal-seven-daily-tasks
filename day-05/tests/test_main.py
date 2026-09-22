import uuid
import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app

pytestmark = pytest.mark.asyncio


async def test_health_check():
    """Verify that the system health endpoint is reachable."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


async def test_user_lifecycle():
    """Verify user creation and retrieval using unique test records."""
    unique_id = uuid.uuid4().hex[:8]
    test_email = f"user_{unique_id}@example.com"
    test_username = f"user_{unique_id}"

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Create a User
        user_data = {
            "username": test_username,
            "email": test_email,
        }
        res_create = await client.post("/users/", json=user_data)
        assert res_create.status_code == 201
        user = res_create.json()
        assert user["email"] == test_email
        user_id = user["id"]

        # 2. Retrieve the User by ID
        res_get = await client.get(f"/users/{user_id}")
        assert res_get.status_code == 200
        assert res_get.json()["id"] == user_id


async def test_product_foreign_key_validation():
    """Verify that creating a product with an invalid owner_id fails."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        invalid_product = {
            "title": "Invalid Product",
            "description": "Owner does not exist",
            "price": 49.99,
            "stock": 5,
            "owner_id": 999999,
        }
        res = await client.post("/products/", json=invalid_product)
        assert res.status_code in [400, 404]


async def test_list_endpoints():
    """Verify pagination on users and products list endpoints."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res_users = await client.get("/users/?skip=0&limit=5")
        assert res_users.status_code == 200
        assert isinstance(res_users.json(), list)

        res_products = await client.get("/products/?skip=0&limit=5")
        assert res_products.status_code == 200
        assert isinstance(res_products.json(), list)