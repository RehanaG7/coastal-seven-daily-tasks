import time
from fastapi import HTTPException, status, Request
from services.cache import redis_client
from core.config import settings

async def rate_limiter(request: Request):
    client_ip = request.client.host if request.client else "127.0.0.1"
    key = f"rate_limit:{client_ip}"
    current_time = time.time()
    window = settings.RATE_LIMIT_WINDOW
    limit = settings.RATE_LIMIT_REQUESTS

    pipe = redis_client.pipeline()
    # 1. Prune timestamps older than (current_time - window)
    pipe.zremrangebyscore(key, 0, current_time - window)
    # 2. Add current request timestamp
    pipe.zadd(key, {str(current_time): current_time})
    # 3. Count remaining requests in the active window
    pipe.zcard(key)
    # 4. Set key TTL so inactive IPs automatically expire
    pipe.expire(key, window)

    results = await pipe.execute()
    request_count = results[2]

    if request_count > limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded! Maximum {limit} requests per {window} seconds."
        )