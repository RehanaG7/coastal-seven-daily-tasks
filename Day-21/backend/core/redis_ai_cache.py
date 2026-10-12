"""
Day 21 - Redis AI Response Caching Layer
Provides deterministic query/prompt hashing, TTL expiration policies,
sub-3ms latency cache hits, and cache invalidation.
"""

import hashlib
import json
import time
from typing import Any, Dict, Optional, Tuple

from core.redis import redis_client, get_async_redis


class RedisAICache:
    """
    High-performance Redis caching layer for AI endpoints:
    - Product descriptions (default TTL: 3600s)
    - Semantic search results (default TTL: 300s)
    - LLM answers & tool outputs (default TTL: 300s)
    """

    PREFIX = "rmart:ai:cache"

    @classmethod
    def generate_key(cls, namespace: str, payload: Any) -> str:
        """
        Creates a deterministic SHA-256 hash key based on namespace and normalized payload.
        """
        if isinstance(payload, str):
            canonical = payload.strip().lower()
        else:
            canonical = json.dumps(payload, sort_keys=True, default=str)
        digest = hashlib.sha256(canonical.encode("utf-8")).hexdigest()[:32]
        return f"{cls.PREFIX}:{namespace}:{digest}"

    @classmethod
    def get(cls, namespace: str, payload: Any) -> Optional[Dict[str, Any]]:
        """
        Synchronously retrieves cached AI result.
        Returns None if cache miss or error.
        """
        try:
            key = cls.generate_key(namespace, payload)
            cached_raw = redis_client.get(key)
            if cached_raw:
                data = json.loads(cached_raw)
                return data
        except Exception as e:
            print(f"[RedisAICache] Cache get error: {e}")
        return None

    @classmethod
    def set(
        cls,
        namespace: str,
        payload: Any,
        data: Any,
        ttl_seconds: int = 3600
    ) -> bool:
        """
        Synchronously stores an AI response into Redis with a TTL.
        """
        try:
            key = cls.generate_key(namespace, payload)
            value = json.dumps(data, default=str)
            redis_client.setex(key, ttl_seconds, value)
            return True
        except Exception as e:
            print(f"[RedisAICache] Cache set error: {e}")
            return False

    @classmethod
    async def get_async(cls, namespace: str, payload: Any) -> Optional[Dict[str, Any]]:
        """
        Asynchronously retrieves cached AI result.
        """
        try:
            r = await get_async_redis()
            key = cls.generate_key(namespace, payload)
            cached_raw = await r.get(key)
            if cached_raw:
                return json.loads(cached_raw)
        except Exception as e:
            print(f"[RedisAICache] Async cache get error: {e}")
        return None

    @classmethod
    async def set_async(
        cls,
        namespace: str,
        payload: Any,
        data: Any,
        ttl_seconds: int = 3600
    ) -> bool:
        """
        Asynchronously stores an AI response into Redis with a TTL.
        """
        try:
            r = await get_async_redis()
            key = cls.generate_key(namespace, payload)
            value = json.dumps(data, default=str)
            await r.setex(key, ttl_seconds, value)
            return True
        except Exception as e:
            print(f"[RedisAICache] Async cache set error: {e}")
            return False

    @classmethod
    def invalidate(cls, namespace: Optional[str] = None) -> int:
        """
        Invalidates cached keys for a namespace or all AI caches.
        """
        try:
            pattern = f"{cls.PREFIX}:{namespace}:*" if namespace else f"{cls.PREFIX}:*"
            keys = []
            if hasattr(redis_client, "keys"):
                keys = redis_client.keys(pattern)
            elif hasattr(redis_client, "store"):
                keys = [k for k in redis_client.store.keys() if k.startswith(f"{cls.PREFIX}:")]
            
            if keys:
                redis_client.delete(*keys)
                return len(keys)
        except Exception as e:
            print(f"[RedisAICache] Invalidate error: {e}")
        return 0


ai_cache = RedisAICache()
