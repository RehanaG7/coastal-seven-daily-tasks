"""
Day 24 DevOps / AWS Focus: Correlation ID & HTTP Structured Access Middleware
Generates or propagates X-Correlation-ID headers across microservices
and emits structured access logs with execution latency.
"""

import time
import uuid
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from core.logging_config import correlation_id_ctx

access_logger = logging.getLogger("http_access")


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    """
    Middleware that ensures every incoming request has a unique correlation ID
    and logs request execution time in structured format.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        # Read incoming correlation ID or generate a new one
        correlation_id = request.headers.get("X-Correlation-ID") or request.headers.get("X-Request-ID")
        if not correlation_id:
            correlation_id = f"req_{uuid.uuid4().hex[:12]}"

        # Bind to contextvar for structured logging
        token = correlation_id_ctx.set(correlation_id)
        start_time = time.perf_counter()

        try:
            response = await call_next(request)
        except Exception as exc:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            # Log failure with structured metadata
            access_logger.error(
                f"Request failed: {request.method} {request.url.path} after {duration_ms}ms",
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": 500,
                    "latency_ms": duration_ms,
                    "client_ip": request.client.host if request.client else "unknown",
                },
                exc_info=True,
            )
            correlation_id_ctx.reset(token)
            raise exc

        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        response.headers["X-Correlation-ID"] = correlation_id

        # Skip spamming logs for health checks and metrics endpoints
        if not request.url.path.endswith(("/live", "/ready", "/metrics", "/health")):
            access_logger.info(
                f"{request.method} {request.url.path} -> {response.status_code} ({duration_ms}ms)",
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "latency_ms": duration_ms,
                    "client_ip": request.client.host if request.client else "unknown",
                },
            )

        correlation_id_ctx.reset(token)
        return response
