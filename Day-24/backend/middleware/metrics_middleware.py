"""
Day 24 DevOps / AWS Focus: Prometheus Application Metrics Middleware
Tracks request counts, response latency histograms, error rates, and system gauges.
"""

import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

try:
    from prometheus_client import (
        Counter,
        Histogram,
        Gauge,
        generate_latest,
        CONTENT_TYPE_LATEST,
        REGISTRY,
    )

    REQUESTS_TOTAL = Counter(
        "rmart_http_requests_total",
        "Total number of HTTP requests processed by endpoint and status code",
        ["method", "endpoint", "status_code"],
    )

    REQUEST_DURATION = Histogram(
        "rmart_http_request_duration_seconds",
        "HTTP request latency histogram in seconds",
        ["method", "endpoint"],
        buckets=(0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0),
    )

    ACTIVE_REQUESTS = Gauge(
        "rmart_active_requests",
        "Number of currently active in-flight requests",
        ["method"],
    )

    PROMETHEUS_AVAILABLE = True

except ImportError:
    PROMETHEUS_AVAILABLE = False
    CONTENT_TYPE_LATEST = "text/plain; version=0.0.4; charset=utf-8"


class PrometheusMetricsMiddleware(BaseHTTPMiddleware):
    """
    Middleware that instruments every incoming HTTP request with Prometheus metrics.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        if not PROMETHEUS_AVAILABLE:
            return await call_next(request)

        # Skip tracking the /metrics endpoint itself to prevent metric pollution
        if request.url.path == "/metrics":
            return await call_next(request)

        method = request.method
        endpoint = request.url.path

        # Normalize high-cardinality paths (e.g. /products/123 -> /products/{id})
        parts = endpoint.split("/")
        if len(parts) > 3 and parts[-1].isdigit():
            endpoint = "/".join(parts[:-1]) + "/{id}"

        ACTIVE_REQUESTS.labels(method=method).inc()
        start_time = time.perf_counter()

        try:
            response = await call_next(request)
            status_code = str(response.status_code)
        except Exception:
            status_code = "500"
            raise
        finally:
            duration = time.perf_counter() - start_time
            REQUEST_DURATION.labels(method=method, endpoint=endpoint).observe(duration)
            REQUESTS_TOTAL.labels(method=method, endpoint=endpoint, status_code=status_code).inc()
            ACTIVE_REQUESTS.labels(method=method).dec()

        return response


def get_prometheus_metrics() -> tuple[bytes, str]:
    """
    Renders Prometheus metrics in text format.
    """
    if PROMETHEUS_AVAILABLE:
        return generate_latest(REGISTRY), CONTENT_TYPE_LATEST
    return b"# Prometheus client is not installed\n", CONTENT_TYPE_LATEST
