from typing import Any, Dict, Optional
import redis
from core.config import settings


class InMemoryRedis:
    def __init__(self) -> None:
        self.store: Dict[str, str] = {}
        self.hashes: Dict[str, Dict[str, str]] = {}

    def get(self, key: str) -> Optional[str]:
        return self.store.get(key)

    def set(self, key: str, value: str, ex: Optional[int] = None) -> None:
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


try:
    redis_client = redis.Redis.from_url(
        settings.REDIS_URL, decode_responses=True, socket_connect_timeout=1
    )
    redis_client.ping()
except Exception:
    redis_client = InMemoryRedis()  # type: ignore


def get_redis_client() -> Any:
    return redis_client
