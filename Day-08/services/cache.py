import json
import redis.asyncio as aioredis
from typing import Optional, Any
from core.config import settings

# Clean async Redis client (using RESP2 naturally on redis<5.0.0)
redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)

async def get_cache(key: str) -> Optional[Any]:
    cached = await redis_client.get(key)
    if cached:
        return json.loads(cached)
    return None

async def set_cache(key: str, data: Any, ttl: int = settings.CACHE_DEFAULT_TTL):
    await redis_client.setex(key, ttl, json.dumps(data))

async def invalidate_cache_pattern(pattern: str):
    """Deletes all Redis keys matching a given pattern, e.g. 'products:*'"""
    keys = await redis_client.keys(pattern)
    if keys:
        await redis_client.delete(*keys)