"""
Day 23 DevOps / AWS Focus Automated Test Suite
Verifies Docker multi-stage configurations, Docker Compose service topology,
Celery Beat periodic task schedules, healthchecks, and environment configuration.
"""

import os
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from main import app
from tasks.celery_app import (
    celery_app,
    periodic_heartbeat_task,
    periodic_cache_cleanup_task,
    periodic_inventory_audit_task
)
from core.config import settings

client = TestClient(app)


def test_docker_health_endpoints():
    """Verify standard Docker container healthcheck endpoints (/health & /api/v1/health)."""
    # 1. Test /health
    res_health = client.get("/health")
    assert res_health.status_code == 200
    data_health = res_health.json()
    assert data_health["status"] == "healthy"
    assert "environment" in data_health
    assert "version" in data_health

    # 2. Test /api/v1/health
    res_api_health = client.get("/api/v1/health")
    assert res_api_health.status_code == 200
    assert res_api_health.json()["status"] == "healthy"


def test_evaluator_database_dump_endpoint():
    """Verify database dump inspection endpoint is operational."""
    res = client.get("/api/v1/database-dump")
    assert res.status_code == 200
    data = res.json()
    assert "users" in data
    assert "products" in data
    assert "orders" in data


def test_environment_and_secret_configuration():
    """Verify settings parses environment variables correctly."""
    assert hasattr(settings, "DATABASE_URL")
    assert hasattr(settings, "REDIS_URL")
    assert hasattr(settings, "CELERY_BROKER_URL")
    assert hasattr(settings, "CELERY_RESULT_BACKEND")
    assert hasattr(settings, "SECRET_KEY")


def test_celery_beat_schedule_registered():
    """Verify Celery Beat periodic task schedule is defined with correct recurring intervals."""
    schedule = celery_app.conf.beat_schedule
    assert "system-heartbeat-every-minute" in schedule
    assert "cache-cleanup-every-5-minutes" in schedule
    assert "inventory-audit-every-10-minutes" in schedule

    # Check recurring task frequencies
    assert schedule["system-heartbeat-every-minute"]["schedule"] == 60.0
    assert schedule["cache-cleanup-every-5-minutes"]["schedule"] == 300.0
    assert schedule["inventory-audit-every-10-minutes"]["schedule"] == 600.0


def test_celery_beat_tasks_execution():
    """Execute Celery Beat periodic tasks directly to confirm logic executes cleanly."""
    res_heartbeat = periodic_heartbeat_task()
    assert res_heartbeat["status"] == "HEALTHY"
    assert "timestamp" in res_heartbeat

    res_cleanup = periodic_cache_cleanup_task()
    assert res_cleanup["status"] == "CLEANUP_COMPLETED"
    assert "timestamp" in res_cleanup

    res_audit = periodic_inventory_audit_task()
    assert res_audit["status"] == "AUDIT_COMPLETED"
    assert "timestamp" in res_audit


def test_docker_compose_topology_validation():
    """Validate that docker-compose.yml defines all required services, networks, and named volumes."""
    compose_path = Path(__file__).resolve().parent.parent.parent / "docker-compose.yml"
    assert compose_path.exists(), "docker-compose.yml must exist in Day-23 root"

    content = compose_path.read_text(encoding="utf-8")

    # 1. Required Services
    required_services = ["db:", "redis:", "backend:", "celery_worker:", "celery_beat:", "frontend:"]
    for s in required_services:
        assert s in content, f"docker-compose.yml missing service: {s}"

    # 2. Named Volumes
    required_volumes = ["postgres_data:", "redis_data:", "media_data:"]
    for v in required_volumes:
        assert v in content, f"docker-compose.yml missing volume: {v}"

    # 3. Custom Bridge Network
    assert "rmart-network:" in content
    assert "driver: bridge" in content

    # 4. Service Healthchecks
    assert "pg_isready" in content
    assert "redis-cli" in content
    assert "curl" in content


def test_dockerfile_multi_stage_structure():
    """Verify backend and frontend Dockerfiles implement multi-stage production builds."""
    backend_dockerfile = Path(__file__).resolve().parent.parent / "Dockerfile"
    frontend_dockerfile = Path(__file__).resolve().parent.parent.parent / "Dockerfile.frontend"

    assert backend_dockerfile.exists()
    assert frontend_dockerfile.exists()

    b_content = backend_dockerfile.read_text(encoding="utf-8")
    f_content = frontend_dockerfile.read_text(encoding="utf-8")

    # Backend multi-stage assertions
    assert "AS builder" in b_content, "Backend Dockerfile must have builder stage"
    assert "AS runtime" in b_content, "Backend Dockerfile must have runtime stage"
    assert "useradd" in b_content, "Backend Dockerfile must enforce non-root user"
    assert "HEALTHCHECK" in b_content, "Backend Dockerfile must define container HEALTHCHECK"

    # Frontend multi-stage assertions
    assert "AS builder" in f_content, "Frontend Dockerfile must have builder stage"
    assert "AS production" in f_content, "Frontend Dockerfile must have production stage"
    assert "nginx" in f_content.lower(), "Frontend production stage must use Nginx"
    assert "HEALTHCHECK" in f_content, "Frontend Dockerfile must define container HEALTHCHECK"


def test_nginx_configuration_validity():
    """Verify nginx.conf defines SPA routing, API reverse proxy, and WebSocket upgrades."""
    nginx_conf = Path(__file__).resolve().parent.parent.parent / "nginx" / "nginx.conf"
    assert nginx_conf.exists()

    content = nginx_conf.read_text(encoding="utf-8")
    assert "try_files $uri $uri/ /index.html;" in content, "Must support client-side SPA routing"
    assert "location /api/" in content, "Must reverse proxy /api/ requests"
    assert "location /ws" in content, "Must reverse proxy WebSocket /ws requests"
    assert "Upgrade" in content, "Must include HTTP Upgrade header for WebSockets"
    assert "gzip on;" in content, "Must enable Gzip compression"
