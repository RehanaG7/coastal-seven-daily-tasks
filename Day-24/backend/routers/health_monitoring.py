"""
Day 24 DevOps / AWS Focus: Multi-Tier Health Checks & Monitoring Router
Provides Liveness (/live), Readiness (/ready), Deep Diagnostics (/deep),
and Prometheus (/metrics) endpoints for AWS ALB, Route53, and UptimeRobot.
"""

import time
import os
import psutil
from fastapi import APIRouter, Response, status
from sqlalchemy import text
from core.database import engine
from middleware.metrics_middleware import get_prometheus_metrics

router = APIRouter(prefix="/health", tags=["Health & Monitoring"])

START_TIME = time.time()


@router.get("/live", status_code=status.HTTP_200_OK)
def liveness_check():
    """
    AWS Application Load Balancer & Container Liveness Probe.
    Returns 200 OK immediately if the ASGI process is responsive.
    """
    uptime_seconds = int(time.time() - START_TIME)
    return {
        "status": "alive",
        "service": "rmart-backend",
        "uptime_seconds": uptime_seconds,
        "environment": os.getenv("ENVIRONMENT", "production"),
    }


@router.get("/ready")
def readiness_check(response: Response):
    """
    Readiness Probe for traffic routing.
    Verifies that downstream database and cache dependencies are operational.
    """
    dependencies = {
        "database": {"status": "unknown", "latency_ms": None},
        "redis": {"status": "unknown", "latency_ms": None},
    }
    all_healthy = True

    # 1. Check PostgreSQL / Relational Database
    db_start = time.perf_counter()
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        dependencies["database"]["status"] = "healthy"
        dependencies["database"]["latency_ms"] = round((time.perf_counter() - db_start) * 1000, 2)
    except Exception as e:
        dependencies["database"]["status"] = f"unhealthy: {str(e)[:80]}"
        all_healthy = False

    # 2. Check Redis Cache / Message Broker
    redis_start = time.perf_counter()
    try:
        import redis
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        client = redis.Redis.from_url(redis_url, socket_timeout=1.0)
        client.ping()
        dependencies["redis"]["status"] = "healthy"
        dependencies["redis"]["latency_ms"] = round((time.perf_counter() - redis_start) * 1000, 2)
    except Exception as e:
        # Graceful fallback if redis is optional in testing
        dependencies["redis"]["status"] = f"degraded: {str(e)[:80]}"
        # If DB is up, we can still mark ready with degraded cache if configured
        if os.getenv("REQUIRE_REDIS_FOR_READINESS", "false").lower() == "true":
            all_healthy = False

    if not all_healthy:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {"status": "unhealthy", "dependencies": dependencies}

    return {"status": "ready", "dependencies": dependencies}


@router.get("/deep")
def deep_diagnostics():
    """
    Deep Diagnostic Check for System Administrators, SRE, and Evaluators.
    Reports memory, CPU utilization, thread counts, and storage metrics.
    """
    process = psutil.Process()
    mem_info = process.memory_info()

    return {
        "service": "rmart-backend",
        "system": {
            "cpu_percent": psutil.cpu_percent(interval=None),
            "memory_usage_mb": round(mem_info.rss / (1024 * 1024), 2),
            "threads_count": process.num_threads(),
            "pid": process.pid,
        },
        "environment": {
            "env": os.getenv("ENVIRONMENT", "production"),
            "database_url_configured": bool(os.getenv("DATABASE_URL")),
            "sentry_active": bool(os.getenv("SENTRY_DSN")),
        },
        "timestamp": time.time(),
    }


# Standalone metrics route mounted at root /metrics
metrics_router = APIRouter(tags=["Prometheus Metrics"])


@metrics_router.get("/metrics")
def prometheus_metrics():
    """
    Prometheus Scrape Endpoint.
    Returns OpenMetrics/Prometheus formatted text for Prometheus and CloudWatch Agent.
    """
    content, content_type = get_prometheus_metrics()
    return Response(content=content, media_type=content_type)
