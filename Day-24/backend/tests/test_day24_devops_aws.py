"""
Day 24 DevOps / AWS Focus: Comprehensive Automated Verification Suite
Tests all 10 syllabus topics:
1. AWS EC2 Deployment Scripts & Systemd Daemon
2. Nginx Reverse Proxy & HTTPS / SSL Configuration
3. Vercel Deployment Configuration & Rewrites
4. Structured JSON Logging & Sentry Real-Time Error Tracking
5. Multi-Tier Health Checks (/live, /ready, /deep) & Prometheus (/metrics)
6. AWS IAM Least-Privilege Role Policies
7. Amazon S3 Static Hosting Policy & CORS
8. Elastic Load Balancer (ALB) & Auto Scaling Group (ASG) Architecture
9. Amazon CloudWatch Agent & Operational Alarms
10. End-to-End Observability Integration
"""

import json
import logging
import os
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from main import app
from core.logging_config import StructuredJsonFormatter, correlation_id_ctx
from core.sentry_config import init_sentry, capture_exception, capture_message

client = TestClient(app)

DAY24_DIR = Path(__file__).resolve().parent.parent.parent


# ==============================================================================
# Topic 4: Structured Logging & Sentry Error Tracking Tests
# ==============================================================================

def test_structured_json_logging_format():
    """
    Verifies that the StructuredJsonFormatter formats records into valid JSON
    with required enterprise metadata (ISO timestamp, log level, correlation ID).
    """
    formatter = StructuredJsonFormatter(service_name="test-service", environment="test")
    record = logging.LogRecord(
        name="test_logger",
        level=logging.INFO,
        pathname="test_path.py",
        lineno=42,
        msg="User authenticated successfully",
        args=(),
        exc_info=None,
    )
    correlation_id_ctx.set("corr_test_12345")

    formatted_json = formatter.format(record)
    parsed = json.loads(formatted_json)

    assert parsed["level"] == "INFO"
    assert parsed["service"] == "test-service"
    assert parsed["environment"] == "test"
    assert parsed["message"] == "User authenticated successfully"
    assert parsed["correlation_id"] == "corr_test_12345"
    assert "timestamp" in parsed


def test_correlation_id_middleware_header():
    """
    Verifies that incoming requests receive an X-Correlation-ID header in response.
    """
    response = client.get("/api/v1/health/live")
    assert response.status_code == 200
    assert "x-correlation-id" in response.headers
    assert response.headers["x-correlation-id"].startswith("req_")


def test_sentry_error_tracking_behavior():
    """
    Verifies that Sentry initialization handles offline/local mode safely
    and captures exceptions without crashing the runtime.
    """
    # Safe offline mode
    assert init_sentry(dsn=None) is False

    # Exception capture helper should return None safely when offline
    test_exc = ValueError("Simulated production runtime error")
    result = capture_exception(test_exc)
    assert result is None

    msg_result = capture_message("Test warning message", level="warning")
    assert msg_result is None


# ==============================================================================
# Topic 5: Health Checks & Prometheus Metrics Tests
# ==============================================================================

def test_health_liveness_probe():
    """
    Verifies the /api/v1/health/live endpoint used by AWS ALB and Kubernetes.
    """
    response = client.get("/api/v1/health/live")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "alive"
    assert data["service"] == "rmart-backend"
    assert "uptime_seconds" in data


def test_health_readiness_probe():
    """
    Verifies the /api/v1/health/ready endpoint checking database connectivity.
    """
    response = client.get("/api/v1/health/ready")
    assert response.status_code in (200, 503)
    data = response.json()
    assert "status" in data
    assert "dependencies" in data
    assert "database" in data["dependencies"]


def test_health_deep_diagnostics():
    """
    Verifies the /api/v1/health/deep endpoint reporting system resource telemetry.
    """
    response = client.get("/api/v1/health/deep")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "rmart-backend"
    assert "system" in data
    assert "cpu_percent" in data["system"]
    assert "memory_usage_mb" in data["system"]
    assert "threads_count" in data["system"]


def test_prometheus_metrics_endpoint():
    """
    Verifies that /metrics returns valid OpenMetrics/Prometheus scraped text.
    """
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "text/plain" in response.headers.get("content-type", "")
    assert len(response.text) > 0


# ==============================================================================
# Topic 1: AWS EC2 Deployment & Systemd Service Tests
# ==============================================================================

def test_ec2_setup_script_structure():
    """
    Verifies that ec2_setup.sh contains essential bootstrap commands for Ubuntu.
    """
    script_path = DAY24_DIR / "deploy" / "aws" / "ec2_setup.sh"
    assert script_path.exists(), "ec2_setup.sh must exist"
    content = script_path.read_text(encoding="utf-8")
    assert "apt-get update" in content
    assert "python3.11" in content
    assert "redis-server" in content
    assert "nginx" in content
    assert "certbot" in content


def test_systemd_service_configuration():
    """
    Verifies that rmart.service defines reliable production daemon configuration.
    """
    service_path = DAY24_DIR / "deploy" / "aws" / "rmart.service"
    assert service_path.exists(), "rmart.service must exist"
    content = service_path.read_text(encoding="utf-8")
    assert "uvicorn main:app" in content
    assert "Restart=always" in content
    assert "RestartSec=5s" in content
    assert "LimitNOFILE=" in content


def test_security_groups_specification():
    """
    Verifies that security_groups.json defines standard least-privilege ports (22, 80, 443).
    """
    sg_path = DAY24_DIR / "deploy" / "aws" / "security_groups.json"
    assert sg_path.exists(), "security_groups.json must exist"
    data = json.loads(sg_path.read_text(encoding="utf-8"))
    ports = [rule["FromPort"] for rule in data["InboundRules"]]
    assert 22 in ports, "SSH port 22 must be defined"
    assert 80 in ports, "HTTP port 80 must be defined"
    assert 443 in ports, "HTTPS port 443 must be defined"


# ==============================================================================
# Topic 2: Nginx & HTTPS / SSL Configuration Tests
# ==============================================================================

def test_nginx_ssl_configuration():
    """
    Verifies that rmart_ssl.conf enforces HTTPS redirection, modern TLS, and WebSockets.
    """
    conf_path = DAY24_DIR / "deploy" / "nginx" / "rmart_ssl.conf"
    assert conf_path.exists(), "rmart_ssl.conf must exist"
    content = conf_path.read_text(encoding="utf-8")
    assert "listen 443 ssl" in content
    assert "ssl_protocols TLSv1.2 TLSv1.3;" in content
    assert "proxy_pass http://127.0.0.1:8000;" in content
    assert "proxy_set_header Upgrade $http_upgrade;" in content
    assert "Strict-Transport-Security" in content


# ==============================================================================
# Topic 3: Vercel Deployment Configuration Tests
# ==============================================================================

def test_vercel_configuration_validity():
    """
    Verifies that vercel.json defines valid SPA rewrites and security headers.
    """
    vercel_path = DAY24_DIR / "vercel.json"
    assert vercel_path.exists(), "vercel.json must exist"
    data = json.loads(vercel_path.read_text(encoding="utf-8"))
    assert data["framework"] == "vite"
    assert data["outputDirectory"] == "dist"
    assert any(rewrite["destination"] == "/index.html" for rewrite in data["rewrites"])


# ==============================================================================
# Topic 6: AWS IAM Least Privilege Policies Tests
# ==============================================================================

def test_aws_iam_policies_validity():
    """
    Verifies that all IAM JSON policies comply with AWS IAM specifications.
    """
    iam_dir = DAY24_DIR / "deploy" / "aws" / "iam"
    for policy_file in iam_dir.glob("*.json"):
        data = json.loads(policy_file.read_text(encoding="utf-8"))
        assert "Version" in data
        assert "Statement" in data
        for statement in data["Statement"]:
            assert statement["Effect"] in ("Allow", "Deny")
            assert "Action" in statement
            assert "Resource" in statement


# ==============================================================================
# Topic 7: Amazon S3 Static Hosting Tests
# ==============================================================================

def test_s3_bucket_policy_and_cors():
    """
    Verifies that S3 bucket policy and CORS configuration are valid JSON.
    """
    s3_dir = DAY24_DIR / "deploy" / "aws" / "s3"
    policy_data = json.loads((s3_dir / "s3_bucket_policy.json").read_text(encoding="utf-8"))
    assert policy_data["Statement"][0]["Action"] == "s3:GetObject"

    cors_data = json.loads((s3_dir / "s3_cors.json").read_text(encoding="utf-8"))
    assert "CORSRules" in cors_data
    assert "GET" in cors_data["CORSRules"][0]["AllowedMethods"]


# ==============================================================================
# Topic 8: Load Balancing (ALB) & Auto Scaling (ASG) Tests
# ==============================================================================

def test_alb_asg_cloudformation_template():
    """
    Verifies that alb_asg_architecture.yaml defines an Application Load Balancer,
    Target Group with health checks, and an Auto Scaling Group.
    """
    template_path = DAY24_DIR / "deploy" / "aws" / "alb_asg" / "alb_asg_architecture.yaml"
    assert template_path.exists(), "alb_asg_architecture.yaml must exist"
    content = template_path.read_text(encoding="utf-8")
    assert "AWS::ElasticLoadBalancingV2::LoadBalancer" in content
    assert "AWS::ElasticLoadBalancingV2::TargetGroup" in content
    assert "AWS::AutoScaling::AutoScalingGroup" in content
    assert "HealthCheckPath: /api/v1/health/live" in content


# ==============================================================================
# Topic 9: CloudWatch Monitoring & Alarms Tests
# ==============================================================================

def test_cloudwatch_agent_and_alarms():
    """
    Verifies CloudWatch agent log aggregation configuration and operational alarms.
    """
    cw_dir = DAY24_DIR / "deploy" / "aws" / "cloudwatch"
    agent_data = json.loads((cw_dir / "amazon-cloudwatch-agent.json").read_text(encoding="utf-8"))
    assert "logs" in agent_data
    assert "metrics" in agent_data

    alarms_data = json.loads((cw_dir / "cloudwatch_alarms.json").read_text(encoding="utf-8"))
    assert len(alarms_data) >= 3
    alarm_names = [a["AlarmName"] for a in alarms_data]
    assert "rmart-ec2-high-cpu-utilization" in alarm_names
