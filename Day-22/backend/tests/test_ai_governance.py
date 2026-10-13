"""
Day 22 Capstone Test Suite - Responsible AI & Cost Governance
Verifies $0.00 API spend audit, token tracking, Redis savings estimation, and quota compliance.
"""

import pytest
from fastapi.testclient import TestClient
from main import app
from core.ai_governance import cost_governance


@pytest.fixture(autouse=True)
def reset_governance():
    cost_governance.reset_metrics()
    yield
    cost_governance.reset_metrics()


def test_ai_governance_initial_stats():
    client = TestClient(app)
    res = client.get("/api/v1/ai/governance/stats")
    assert res.status_code == 200
    data = res.json()

    assert data["status"] == "COMPLIANT"
    assert data["target_spend"] == "$0.00"
    assert data["actual_spend"] == "$0.00"
    assert "100% Free-Tier" in data["free_tier_status"]
    assert data["total_requests"] == 0
    assert data["cache_hit_ratio_percent"] == 0.0
    assert len(data["active_providers"]) == 3


def test_ai_governance_tracks_transactions_and_calculates_savings():
    client = TestClient(app)

    # 1. Simulate an AI copywriter operation (Cache Miss)
    res1 = client.post(
        "/api/v1/ai/generate-description",
        json={"title": "Ergonomic Mechanical Keyboard", "category": "Electronics"}
    )
    assert res1.status_code == 200

    # 2. Re-run identical operation (Triggers Redis Cache Hit)
    res2 = client.post(
        "/api/v1/ai/generate-description",
        json={"title": "Ergonomic Mechanical Keyboard", "category": "Electronics"}
    )
    assert res2.status_code == 200

    # 3. Check governance statistics
    res = client.get("/api/v1/ai/governance/stats")
    assert res.status_code == 200
    stats = res.json()

    assert stats["total_requests"] >= 2
    assert stats["cache_hits"] >= 1
    assert stats["actual_spend"] == "$0.00"  # Target $0.00 spend verified!
    assert stats["estimated_dollars_saved"] >= 0.0
    assert stats["cache_hit_ratio_percent"] > 0.0
    assert len(stats["recent_transactions"]) >= 2
    assert stats["recent_transactions"][0]["actual_cost"] == 0.0


def test_ai_governance_reset_endpoint():
    client = TestClient(app)

    # Record dummy metric
    cost_governance.record_transaction(
        endpoint="/test",
        provider="Gemini",
        prompt_tokens=100,
        completion_tokens=50
    )
    assert cost_governance._total_requests == 1

    # Reset via API
    res = client.post("/api/v1/ai/governance/reset")
    assert res.status_code == 200
    assert res.json()["success"] is True

    # Verify reset
    stats_res = client.get("/api/v1/ai/governance/stats")
    assert stats_res.json()["total_requests"] == 0
