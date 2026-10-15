"""
Day 24 DevOps / AWS Focus: Structured JSON Logging Configuration
Provides machine-readable, indexable JSON logging compatible with
AWS CloudWatch Logs, Datadog, Elasticsearch, and Grafana Loki.
"""

import json
import logging
import sys
from datetime import datetime, timezone
from typing import Any, Dict, Optional
import contextvars

# ContextVar for request-scoped correlation tracing
correlation_id_ctx: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("correlation_id", default=None)


class StructuredJsonFormatter(logging.Formatter):
    """
    Formats standard Python logging records into structured JSON objects.
    Enriches logs with correlation_id, timestamps, log levels, and extra metadata.
    """

    def __init__(self, service_name: str = "rmart-backend", environment: str = "production"):
        super().__init__()
        self.service_name = service_name
        self.environment = environment

    def format(self, record: logging.LogRecord) -> str:
        log_payload: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "service": self.service_name,
            "environment": self.environment,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "line": record.lineno,
        }

        # Inject request-scoped correlation ID if active
        cid = correlation_id_ctx.get()
        if cid:
            log_payload["correlation_id"] = cid

        # Extract extra structured fields attached to the log call
        if hasattr(record, "extra_fields") and isinstance(record.extra_fields, dict):
            log_payload.update(record.extra_fields)

        # Include HTTP access metadata if present
        for field in ("method", "path", "status_code", "latency_ms", "client_ip", "user_id"):
            if hasattr(record, field):
                log_payload[field] = getattr(record, field)

        # Include exception tracebacks if an exception was caught
        if record.exc_info:
            log_payload["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_payload, default=str)


def setup_structured_logging(
    level: int = logging.INFO,
    service_name: str = "rmart-backend",
    environment: str = "production",
) -> None:
    """
    Configures the root logger to use StructuredJsonFormatter streaming to stdout.
    """
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(StructuredJsonFormatter(service_name=service_name, environment=environment))

    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    # Remove existing handlers to prevent duplicate lines
    for h in root_logger.handlers[:]:
        root_logger.removeHandler(h)

    root_logger.addHandler(handler)

    # Standardize Uvicorn loggers to JSON output
    for uvicorn_logger_name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        u_log = logging.getLogger(uvicorn_logger_name)
        u_log.handlers = [handler]
        u_log.propagate = False
