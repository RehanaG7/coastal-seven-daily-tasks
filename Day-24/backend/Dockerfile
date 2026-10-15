# ==============================================================================
# Day 24 DevOps / AWS Focus: Multi-Stage Production Dockerfile for FastAPI Backend & Celery
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Builder (compiles native C dependencies and prepares wheels)
# ------------------------------------------------------------------------------
FROM python:3.11-slim AS builder

WORKDIR /build

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install compiler tools and PostgreSQL development libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create isolated virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies into virtual environment
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# ------------------------------------------------------------------------------
# Stage 2: Lean Production Runtime (Non-root user, minimal attack surface)
# ------------------------------------------------------------------------------
FROM python:3.11-slim AS runtime

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    PYTHONPATH=/app

# Install lightweight runtime libraries only (libpq for postgres, curl for healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Security Hardening: Non-root user & group (appuser)
RUN groupadd -g 1000 appgroup && \
    useradd -u 1000 -g appgroup -s /bin/bash -m appuser

# Copy pre-built virtual environment from builder stage
COPY --from=builder /opt/venv /opt/venv

# Copy application source code with non-root ownership
COPY --chown=appuser:appgroup . /app

# Ensure directories for static, media, and logs exist with proper permissions
RUN mkdir -p /app/static /app/media /app/chroma_db && \
    chown -R appuser:appgroup /app

USER appuser

EXPOSE 8000

# Container Healthcheck (polls /api/v1/health every 30s)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

# Default Command: ASGI production server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
