import json
import redis
from core.config import settings

# Initialize Redis client (decode_responses=True returns strings instead of raw bytes)
try:
    redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
    redis_client.ping()
    REDIS_AVAILABLE = True
except Exception:
    redis_client = None
    REDIS_AVAILABLE = False


def get_cache(key: str):
    if not REDIS_AVAILABLE or not redis_client:
        return None
    try:
        data = redis_client.get(key)
        return json.loads(data) if data else None
    except Exception:
        return None


def set_cache(key: str, value: dict | list, ttl_seconds: int = 60):
    if not REDIS_AVAILABLE or not redis_client:
        return
    try:
        redis_client.setex(key, ttl_seconds, json.dumps(value, default=str))
    except Exception:
        pass


def invalidate_cache_pattern(pattern: str):
    if not REDIS_AVAILABLE or not redis_client:
        return
    try:
        keys = redis_client.keys(pattern)
        if keys:
            redis_client.delete(*keys)
    except Exception:
        pass