import json
import pytest
from fastapi.testclient import TestClient

from main import app
from models.product import Product
from models.user import User
from core.vector_store import vector_store
from core.ai_service import ai_service


client = TestClient(app)


@pytest.fixture
def db():
    from tests.conftest import TestingSessionLocal
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def seed_test_products(db):
    """Ensure sample products (in-stock and out-of-stock) are in the test database."""
    admin_user = db.query(User).filter(User.email == "ai_admin@rmart.com").first()
    if not admin_user:
        admin_user = User(
            email="ai_admin@rmart.com",
            hashed_password="hashed_secret_password",
            role="admin"
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

    # Add test products without wiping existing database fixtures
    p1 = db.query(Product).filter(Product.name == "Sony WH-1000XM5 Wireless Headphones").first()
    if not p1:
        p1 = Product(
            name="Sony WH-1000XM5 Wireless Headphones",
            description="Premium active noise cancelling with 30-hour battery and high-res audio.",
            price=349.99,
            stock=15,
            category="Audio"
        )
        db.add(p1)

    p2 = db.query(Product).filter(Product.name == "Apple iPhone 15 Pro Max 256GB").first()
    if not p2:
        p2 = Product(
            name="Apple iPhone 15 Pro Max 256GB",
            description="Titanium smartphone with A17 Pro chip and super retina XDR display.",
            price=1199.99,
            stock=0,  # Explicitly OUT OF STOCK
            category="Mobiles"
        )
        db.add(p2)

    p3 = db.query(Product).filter(Product.name == "Mechanical Gaming Keyboard RGB").first()
    if not p3:
        p3 = Product(
            name="Mechanical Gaming Keyboard RGB",
            description="Custom tactile hot-swappable switches with dynamic RGB backlighting.",
            price=89.99,
            stock=25,
            category="Accessories"
        )
        db.add(p3)

    db.commit()
    db.refresh(p1)
    db.refresh(p2)
    db.refresh(p3)
    return [p1, p2, p3]


def test_ai_health_endpoint():
    """Verify GET /api/v1/ai/health returns valid system and provider health status."""
    res = client.get("/api/v1/ai/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "online"
    assert data["vector_store"]["engine"] == "ChromaDB"
    assert "collection" in data["vector_store"]
    assert "providers" in data
    assert "primary" in data["providers"]
    assert "tertiary" in data["providers"]
    assert data["providers"]["tertiary"]["configured"] is True


def test_index_catalog_endpoint(seed_test_products):
    """Verify POST /api/v1/ai/index-catalog chunks and embeds products into ChromaDB."""
    res = client.post("/api/v1/ai/index-catalog")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["total_indexed"] >= 3
    assert data["collection"] == "product_catalog"


def test_vector_store_semantic_search(seed_test_products, db):
    """Verify ChromaDB semantic similarity search retrieves relevant products."""
    vector_store.index_products(db)

    results = vector_store.search_similar_products("noise cancelling headphones", top_k=2, db=db)
    assert len(results) > 0
    top_hit = results[0]
    assert "Sony" in top_hit["title"] or "Headphones" in top_hit["title"]
    assert top_hit["price"] == 349.99
    assert top_hit["stock"] > 0


def test_out_of_stock_directive_and_grounding(seed_test_products, db):
    """
    Verify that out-of-stock items trigger the explicit reassuring boss notification directive:
    'I will say my boss (the admin) to add stock as soon as possible and make it available!'
    """
    vector_store.index_products(db)

    # Search for the out-of-stock iPhone
    results = vector_store.search_similar_products("iPhone 15 Pro", top_k=2, db=db)
    assert any(p["stock"] == 0 for p in results)

    # Generate response
    import asyncio

    async def get_response():
        full = ""
        async for chunk in ai_service.stream_chat("Can I buy the iPhone 15?", db=db):
            if chunk.startswith("event: token"):
                data = json.loads(chunk.split("data: ")[1])
                full += data["token"]
        return full

    reply = asyncio.run(get_response())
    assert "boss" in reply.lower()
    assert "admin" in reply.lower()
    assert "stock" in reply.lower()


def test_shopping_joke_delivery(seed_test_products, db):
    """Verify the assistant cracks witty jokes on request."""
    import asyncio

    async def get_response():
        full = ""
        async for chunk in ai_service.stream_chat("Tell me a funny joke!", db=db):
            if chunk.startswith("event: token"):
                data = json.loads(chunk.split("data: ")[1])
                full += data["token"]
        return full

    reply = asyncio.run(get_response())
    assert any(kw in reply.lower() for kw in ["joke", "programmer", "computer", "smartphone", "binary"])


def test_sse_streaming_endpoint(seed_test_products):
    """Verify POST /api/v1/ai/chat/stream returns text/event-stream with metadata and token chunks."""
    payload = {
        "message": "Looking for wireless headphones under $400",
        "history": []
    }
    with client.stream("POST", "/api/v1/ai/chat/stream", json=payload) as response:
        assert response.status_code == 200
        assert "text/event-stream" in response.headers["content-type"]

        lines = [line for line in response.iter_lines() if line]
        assert any("event: metadata" in line for line in lines)
        assert any("event: token" in line for line in lines)
        assert any("event: done" in line for line in lines)
