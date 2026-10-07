import os
import json
import asyncio
from typing import Any, Dict, Optional
import redis
import redis.asyncio as aioredis
from core.config import settings


class InMemoryRedis:
    def __init__(self) -> None:
        self.store: Dict[str, str] = {}
        self.hashes: Dict[str, Dict[str, str]] = {}

    def get(self, key: str) -> Optional[str]:
        return self.store.get(key)

    def set(self, key: str, value: str, ex: Optional[int] = None) -> None:
        self.store[key] = value

    def setex(self, key: str, time: int, value: str) -> None:
        self.store[key] = value

    def delete(self, *keys: str) -> None:
        for k in keys:
            self.store.pop(k, None)
            self.hashes.pop(k, None)

    def hgetall(self, key: str) -> Dict[str, str]:
        return dict(self.hashes.get(key, {}))

    def hset(
        self,
        key: str,
        name: Optional[str] = None,
        val: Optional[str] = None,
        mapping: Optional[Dict[str, str]] = None,
    ) -> None:
        if key not in self.hashes:
            self.hashes[key] = {}
        if name is not None and val is not None:
            self.hashes[key][str(name)] = str(val)
        if mapping:
            updated = {str(k): str(v) for k, v in mapping.items()}
            self.hashes[key].update(updated)

    def hdel(self, key: str, *fields: str) -> None:
        if key in self.hashes:
            for f in fields:
                self.hashes[key].pop(str(f), None)

    def ping(self) -> bool:
        return True


shared_in_memory_redis = InMemoryRedis()


class AsyncInMemoryPubSub:
    async def subscribe(self, *channels: str) -> None:
        pass

    async def unsubscribe(self, *channels: str) -> None:
        pass

    async def get_message(self, ignore_subscribe_messages: bool = True, timeout: float = 1.0) -> Optional[Dict[str, Any]]:
        return None


class AsyncInMemoryRedis:
    def __init__(self, mem: InMemoryRedis):
        self._mem = mem

    async def get(self, key: str) -> Optional[str]:
        return self._mem.get(key)

    async def set(self, key: str, value: str, ex: Optional[int] = None) -> None:
        self._mem.set(key, value, ex=ex)

    async def setex(self, key: str, time: int, value: str) -> None:
        self._mem.setex(key, time, value)

    async def delete(self, *keys: str) -> None:
        self._mem.delete(*keys)

    async def publish(self, channel: str, message: str) -> int:
        return 1

    async def close(self) -> None:
        pass

    async def aclose(self) -> None:
        pass

    def pubsub(self) -> AsyncInMemoryPubSub:
        return AsyncInMemoryPubSub()


try:
    redis_client = redis.Redis.from_url(
        settings.REDIS_URL, decode_responses=True, socket_connect_timeout=1
    )
    redis_client.ping()
except Exception:
    redis_client = shared_in_memory_redis  # type: ignore


def get_redis_client() -> Any:
    return redis_client


async def get_async_redis() -> Any:
    try:
        r = aioredis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            protocol=2,
            socket_connect_timeout=1,
        )
        await r.ping()
        return r
    except Exception:
        return AsyncInMemoryRedis(shared_in_memory_redis)

