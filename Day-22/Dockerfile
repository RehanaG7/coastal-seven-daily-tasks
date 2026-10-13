# Day 22 Capstone: Production Multi-Stage Dockerfile
# Serves FastAPI backend and Celery background workers

FROM python:3.11-slim as base

# Set working directory & environment
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/backend

# Install OS dependencies (curl, build tools for sqlite/chroma)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /app/requirements.txt

# Copy backend source code
COPY backend/ /app/backend/
COPY static/ /app/static/

# Expose port
EXPOSE 8000

# Default command: launch uvicorn
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
