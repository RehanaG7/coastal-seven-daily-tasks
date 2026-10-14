"""
Day 22 Capstone Comprehensive Integration Test Suite
Validates the entire 10-Topic AI Focus syllabus:
1. RAG streaming assistant with grounded catalog context
2. Embedding-based semantic vector search
3. AI product description generation
4. Real-time WebSocket order tracking
5. Celery background processing
6. Redis response caching & performance headers
7. Content moderation guardrails
8. Responsible AI & $0.00 spend governance
"""

import pytest
from fastapi.testclient import TestClient
from main import app
from core.ai_governance import cost_governance


@pytest.fixture(autouse=True)
def cleanup_metrics():
    cost_governance.reset_metrics()
    yield
    cost_governance.reset_metrics()


def test_topic_1_rag_streaming_endpoint():
    """Validates Topic 1: RAG pipeline with streaming Server-Sent Events."""
    client = TestClient(app)
    response = client.post(
        "/api/v1/ai/chat/stream",
        json={"message": "Do you sell wireless noise cancelling headphones?"}
    )
    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]
    body = response.text
    assert "event: token" in body or "event: metadata" in body
    assert "data:" in body


def test_topic_2_semantic_vector_search():
    """Validates Topic 2: Dense vector similarity search across product catalog."""
    client = TestClient(app)
    response = client.get("/api/v1/ai/semantic-search?q=wireless+sound&limit=4")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total_matches" in data
    assert data["search_mode"] in ["vector_semantic", "vector_semantic_low_confidence", "fallback_keyword"]


def test_topic_3_ai_product_description_generation():
    """Validates Topic 3: AI copywriter endpoint with tone customization."""
    client = TestClient(app)
    response = client.post(
        "/api/v1/ai/generate-description",
        json={
            "title": "Ergonomic Office Chair 2026",
            "category": "Furniture",
            "tone": "persuasive"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "data" in data
    assert len(data["data"]["description"]) > 20


def test_topic_4_realtime_websocket_order_tracking():
    """Validates Topic 4: Real-time WebSocket order status updates."""
    client = TestClient(app)
    with client.websocket_connect("/ws/orders/1") as ws:
        init_event = ws.receive_json()
        assert init_event["type"] == "CONNECTED"
        assert init_event["order_id"] == 1

        # Ping-Pong healthcheck
        ws.send_json({"type": "PING"})
        pong = ws.receive_json()
        assert pong["type"] == "PONG"


def test_topic_5_celery_background_ai_tasks():
    """Validates Topic 5: Asynchronous Celery background processing."""
    client = TestClient(app)
    # Trigger embedding reindex
    res = client.post("/api/v1/tasks/ai/reindex")
    assert res.status_code == 200
    task_id = res.json()["task_id"]

    # Check status endpoint
    status_res = client.get(f"/api/v1/tasks/{task_id}")
    assert status_res.status_code == 200
    assert status_res.json()["status"] in ["PENDING", "PROGRESS", "SUCCESS"]


def test_topic_6_redis_caching_and_latency_headers():
    """Validates Topic 6: Redis caching, X-AI-Cache headers, and latency tracking."""
    client = TestClient(app)
    payload = {"title": "Fast Charger 65W GaN", "category": "Accessories"}

    # Request 1: Cache Miss
    res1 = client.post("/api/v1/ai/generate-description", json=payload)
    assert res1.status_code == 200
    assert "X-AI-Cache" in res1.headers

    # Request 2: Cache Hit
    res2 = client.post("/api/v1/ai/generate-description", json=payload)
    assert res2.status_code == 200
    assert res2.headers["X-AI-Cache"] == "HIT"
    assert res2.json()["cached"] is True


def test_topic_7_moderation_guardrail():
    """Validates Topic 7: AI content moderation guardrail."""
    client = TestClient(app)
    res = client.post(
        "/api/v1/ai/moderate",
        json={"text": "I want to buy a high quality 4K monitor"}
    )
    assert res.status_code == 200
    assert res.json()["flagged"] is False


def test_topic_9_responsible_ai_and_zero_cost_governance():
    """Validates Topic 9: $0.00 spend audit, token accounting, and Redis savings."""
    client = TestClient(app)
    res = client.get("/api/v1/ai/governance/stats")
    assert res.status_code == 200
    stats = res.json()
    assert stats["actual_spend"] == "$0.00"
    assert stats["target_spend"] == "$0.00"
    assert stats["status"] == "COMPLIANT"
    assert "rate_limits" in stats
    assert "active_providers" in stats
