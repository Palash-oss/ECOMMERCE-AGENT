import time
import hashlib
import json
import logging
from typing import Any, Optional, Dict
from threading import Lock

logger = logging.getLogger("nexus.cache")

class InMemoryTTLCache:
    """Thread-safe in-process TTL cache with automatic expiration and hit/miss stats."""

    def __init__(self, default_ttl: int = 60):
        self.default_ttl = default_ttl
        self._store: Dict[str, Dict[str, Any]] = {}
        self._lock = Lock()
        self.hits = 0
        self.misses = 0

    def _generate_key(self, prefix: str, user_id: str, filters: Dict[str, Any]) -> str:
        serialized = json.dumps(filters, sort_keys=True, default=str)
        digest = hashlib.sha256(serialized.encode("utf-8")).hexdigest()[:16]
        return f"{prefix}:{user_id}:{digest}"

    def get(self, key: str) -> Optional[Any]:
        now = time.time()
        with self._lock:
            entry = self._store.get(key)
            if not entry:
                self.misses += 1
                return None
            if now > entry["expires_at"]:
                del self._store[key]
                self.misses += 1
                return None
            self.hits += 1
            return entry["value"]

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        duration = ttl if ttl is not None else self.default_ttl
        expires_at = time.time() + duration
        with self._lock:
            self._store[key] = {
                "value": value,
                "expires_at": expires_at
            }

    def clear(self) -> None:
        with self._lock:
            self._store.clear()

    def get_stats(self) -> Dict[str, Any]:
        with self._lock:
            valid_count = sum(1 for e in self._store.values() if e["expires_at"] > time.time())
            total_reqs = self.hits + self.misses
            hit_rate = (self.hits / total_reqs * 100) if total_reqs > 0 else 0
            return {
                "cached_entries": valid_count,
                "hits": self.hits,
                "misses": self.misses,
                "hit_rate_pct": round(hit_rate, 2),
                "backend": "in-process-ttl"
            }

# Global cache instance
cache = InMemoryTTLCache(default_ttl=60)
