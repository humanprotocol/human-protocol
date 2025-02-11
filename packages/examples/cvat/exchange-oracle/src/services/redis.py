import redis.asyncio as aredis

from src.core.config import Config


def get_aredis_client() -> aredis.Redis:
    return aredis.Redis.from_url(Config.redis_config.connection_url(), encoding="utf-8")
