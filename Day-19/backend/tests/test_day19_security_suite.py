import pytest
from fastapi.testclient import TestClient

def test_01_slowapi_rate_limiting_enforcement(client: TestClient):
    """
    OWASP Rate Limiting Verification:
    Tests that rapid requests exceeding the defined limit receive HTTP 429 Too Many Requests.
    """
    # 1. Requests within limit (limit is 3/minute)
    for i in range(3):
        res = client.get("/api/v1/test-rate-limit")
        assert res.status_code == 200, f"Request {i+1} should succeed"
        assert res.json()["allowed"] is True

    # 2. 4th request must be blocked by the security guard (HTTP 429)
    res_blocked = client.get("/api/v1/test-rate-limit")
    assert res_blocked.status_code == 429, "4th request must be rate-limited with 429"
    assert "Rate limit exceeded" in res_blocked.json()["detail"]
    assert res_blocked.json()["error_code"] == "RATE_LIMIT_EXCEEDED"
    assert "Retry-After" in res_blocked.headers


def test_02_owasp_security_headers_present(client: TestClient):
    """
    OWASP API Security Top 10 Headers:
    Verifies that all outgoing responses have anti-clickjacking, nosniff, and HSTS headers.
    """
    res = client.get("/")
    assert res.status_code == 200
    
    # 1. Anti-clickjacking
    assert res.headers.get("X-Frame-Options") == "DENY"
    
    # 2. Anti-MIME sniffing
    assert res.headers.get("X-Content-Type-Options") == "nosniff"
    
    # 3. XSS Filter
    assert res.headers.get("X-XSS-Protection") == "1; mode=block"
    
    # 4. HSTS (Strict Transport Security)
    assert "Strict-Transport-Security" in res.headers
    
    # 5. Referrer Policy
    assert res.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"


def test_03_owasp_bfla_customer_forbidden_from_admin_ops(client: TestClient, user_token: str):
    """
    OWASP Broken Function Level Authorization (BFLA):
    Verifies that customer accounts cannot execute admin-level catalog deletions or updates.
    """
    # Customer attempts to delete product ID 1
    res = client.delete(
        "/api/v1/products/1",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert res.status_code == 403, "Non-admin must receive 403 Forbidden"


def test_04_gzip_compression_enabled(client: TestClient):
    """
    Response Compression (GZip):
    Verifies that payloads exceeding 1000 bytes are automatically compressed with gzip.
    """
    res = client.get("/api/v1/test-compression", headers={"Accept-Encoding": "gzip"})
    assert res.status_code == 200
    assert res.headers.get("Content-Encoding") == "gzip"
    assert "GZip compression verification" in res.json()["message"]
