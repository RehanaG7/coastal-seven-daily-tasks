"""
Day 21 - Per-User Rate Limiter for AI Endpoints
Enforces tiered request quotas keyed by authenticated User ID (JWT) or Client IP.
Tiers:
- Anonymous (unauthenticated): 5 req/min
- Customer (authenticated): 20 req/min
- Admin: 60 req/min
"""

import time
from typing import Tuple, Optional
from fastapi import Request, HTTPException, Depends
from jose import jwt, JWTError

from core.config import settings
from core.redis import redis_client


RATE_LIMIT_TIERS = {
    "anonymous": {"limit": 5, "window": 60},
    "customer": {"limit": 20, "window": 60},
    "admin": {"limit": 60, "window": 60},
}


def resolve_request_identity(request: Request) -> Tuple[str, str]:
    """
    Extracts identity key and role from JWT Authorization header, or client IP.
    Returns: (identity_key, role)
    """
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            user_id = payload.get("sub")
            role = payload.get("role", "customer")
            if user_id:
                return f"user:{user_id}", role if role in RATE_LIMIT_TIERS else "customer"
        except (JWTError, Exception):
            pass

    # Unauthenticated fallback to client IP
    client_ip = request.client.host if request.client else "127.0.0.1"
    # Respect X-Forwarded-For if present
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()

    return f"ip:{client_ip}", "anonymous"


class AIRateLimiter:
    """
    Redis-backed sliding window rate limiter for AI operations.
    """

    def __init__(self, custom_tier: Optional[str] = None):
        self.custom_tier = custom_tier

    async def __call__(self, request: Request):
        identity, role = resolve_request_identity(request)
        tier_name = self.custom_tier or role
        tier_cfg = RATE_LIMIT_TIERS.get(tier_name, RATE_LIMIT_TIERS["anonymous"])
        limit = tier_cfg["limit"]
        window = tier_cfg["window"]

        # 60-second time block key
        current_window = int(time.time() // window)
        cache_key = f"rmart:ratelimit:ai:{identity}:{current_window}"
        reset_time = int((current_window + 1) * window - time.time())

        try:
            # Check current count in Redis or in-memory
            current_count_raw = redis_client.get(cache_key)
            current_count = int(current_count_raw) if current_count_raw else 0

            if current_count >= limit:
                raise HTTPException(
                    status_code=429,
                    detail=f"Too Many Requests (HTTP 429): You have exceeded your AI request limit. Please wait a moment before trying again. (Limit: {limit}/min, retry in {reset_time}s)",
                    headers={
                        "Retry-After": str(reset_time),
                        "X-RateLimit-Limit": str(limit),
                        "X-RateLimit-Remaining": "0",
                        "X-RateLimit-Reset": str(reset_time),
                        "X-RateLimit-Identity": identity,
                    }
                )

            # Increment count
            if current_count == 0:
                redis_client.setex(cache_key, window + 5, "1")
                new_count = 1
            else:
                # Increment synchronously
                if hasattr(redis_client, "incr"):
                    new_count = redis_client.incr(cache_key)
                else:
                    new_count = current_count + 1
                    redis_client.setex(cache_key, window + 5, str(new_count))

            remaining = max(0, limit - new_count)

            # Store rate limit info in request.state for response header injection
            request.state.ai_rate_limit = {
                "limit": limit,
                "remaining": remaining,
                "reset": reset_time,
                "identity": identity,
            }

            return True

        except HTTPException:
            raise
        except Exception as e:
            # Graceful failure: if Redis has an issue, allow the request rather than blocking user
            print(f"[AIRateLimiter] Limiter check exception: {e}")
            return True


# Dependency instances
ai_rate_limit_dep = AIRateLimiter()
