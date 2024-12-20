from collections.abc import Callable
from copy import deepcopy
from typing import Any, ClassVar

import aiocache.serializers
import cachelib.serializers
from cachelib import BaseCache, RedisCache

from src.core.config import Config


class _RedisSerializer(cachelib.serializers.RedisSerializer):
    # The default Pickle-based serializer is not safe, here we use MsgPack as a safer alternative.
    # JSON could also be used, but it is less efficient and has restrictions on message contents.

    def __init__(self):
        super().__init__()
        self._impl = aiocache.serializers.MsgPackSerializer()

    def dump(self, *args, **kwargs):  # noqa: ARG002
        raise AssertionError("This method must not be called")

    def load(self, *args, **kwargs):  # noqa: ARG002
        raise AssertionError("This method must not be called")

    def dumps(self, value: Any) -> bytes:
        return self._impl.dumps(value)

    def loads(self, bvalue: bytes) -> Any:
        return self._impl.loads(bvalue)


class _RedisCache(RedisCache):
    def __init__(self, *args, **kwargs):
        kwargs.setdefault("decode_responses", False)
        kwargs.setdefault("key_prefix", kwargs.pop("namespace", ""))

        self.serializer = kwargs.pop("serializer", None) or _RedisSerializer()

        super().__init__(*args, **kwargs)


class CacheManager:
    _configs: ClassVar[dict[str, dict]] = {
        "default": {
            "class": _RedisCache,
            "host": Config.redis_config.host,
            "port": Config.redis_config.port,
            **({"password": Config.redis_config.password} if Config.redis_config.password else {}),
            **({"username": Config.redis_config.user} if Config.redis_config.user else {}),
            "ssl": Config.redis_config.use_ssl,
            "db": Config.redis_config.database,
            "namespace": "cache",
        },
    }

    _caches: ClassVar[dict[str, BaseCache]] = {}

    def create_cache(self, name: str, **kwargs) -> BaseCache:
        cache_config = deepcopy(self._configs[name])
        cache_config.setdefault("default_timeout", 0)
        cache_config.update(kwargs)

        klass = cache_config.pop("class")
        return klass(**cache_config)

    def get_cache(self, name: str = "default") -> BaseCache:
        # Implements a singleton pattern, doesn't support multithreading
        cache = self._caches.get(name)
        if cache is None:
            cache = self.create_cache(name)
            self._caches[name] = cache

        return cache


def get_cache(name: str = "default") -> BaseCache:
    manager = CacheManager()
    return manager.get_cache(name)


class Cache:
    def _get_cache(self) -> BaseCache:
        return get_cache()

    @staticmethod
    def _make_key(escrow_address: str, chain_id: int) -> str:
        return f"{escrow_address}@{chain_id}"

    def _get_or_set(self, key: str, set_callback, *, ttl: int | None = None):
        cache = self._get_cache()
        item = cache.get(key)

        if not item:
            item = set_callback()
            success = cache.set(key, item, timeout=ttl)
            if not success:
                raise Exception(f"Failed to write key {key} to the cache")

        return item

    def get_or_set_manifest(
        self, escrow_address: str, chain_id: int, *, set_callback: Callable[[], dict], **kwargs
    ) -> dict:
        kwargs.setdefault("ttl", Config.features.manifest_cache_ttl)
        key = self._make_key(escrow_address, chain_id)
        return self._get_or_set(key, set_callback=set_callback, **kwargs)
