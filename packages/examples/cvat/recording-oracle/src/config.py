# pylint: disable=too-few-public-methods,missing-class-docstring
""" Project configuration from env vars """
import os
from dotenv import load_dotenv

load_dotenv()


def str_to_bool(val: str) -> bool:
    return val is True or val == "True"


class Postgres:
    port = os.environ.get("PG_PORT", "5434")
    host = os.environ.get("PG_HOST", "0.0.0.0")
    user = os.environ.get("PG_USER", "admin")
    password = os.environ.get("PG_PASSWORD", "admin")
    database = os.environ.get("PG_DB", "recording_oracle")

    @classmethod
    def connection_url(cls):
        return f"postgresql://{Postgres.user}:{Postgres.password}@{Postgres.host}:{Postgres.port}/{Postgres.database}"


class PolygonMainnetConfig:
    chain_id = 137
    rpc_api = os.environ.get("POLYGON_MAINNET_RPC_API_URL")
    private_key = os.environ.get("POLYGON_MAINNET_PRIVATE_KEY")
    addr = os.environ.get("POLYGON_MAINNET_ADDR")


class PolygonMumbaiConfig:
    chain_id = 80001
    rpc_api = os.environ.get("POLYGON_MUMBAI_RPC_API_URL")
    private_key = os.environ.get("POLYGON_MUMBAI_PRIVATE_KEY")
    addr = os.environ.get("POLYGON_MUMBAI_ADDR")


class CronConfig:
    process_exchange_oracle_webhooks_int = int(
        os.environ.get("PROCESS_EXCHANGE_ORACLE_WEBHOOKS_INT", 30)
    )
    process_exchange_oracle_webhooks_chunk_size = os.environ.get(
        "PROCESS_EXCHANGE_ORACLE_WEBHOOKS_CHUNK_SIZE", 5
    )
    process_reputation_oracle_webhooks_int = int(
        os.environ.get("PROCESS_REPUTATION_ORACLE_WEBHOOKS_INT", 3000)
    )
    process_reputation_oracle_webhooks_chunk_size = os.environ.get(
        "PROCESS_REPUTATION_ORACLE_WEBHOOKS_CHUNK_SIZE", 5
    )


class StorageConfig:
    endpoint_url = os.environ.get("ENDPOINT_URL", "storage.googleapis.com")
    region = os.environ.get("REGION", "")
    access_key = os.environ.get("ACCESS_KEY", "")
    secret_key = os.environ.get("SECRET_KEY", "")
    results_bucket_name = os.environ.get("RESULTS_BUCKET_NAME", "")

    @classmethod
    def bucket_url(cls):
        return (
            f"https://{StorageConfig.results_bucket_name}.{StorageConfig.endpoint_url}/"
        )


class Config:
    port = int(os.environ.get("PORT", 8000))
    environment = os.environ.get("ENVIRONMENT", "development")
    workers_amount = int(os.environ.get("WORKERS_AMOUNT", 1))
    webhook_max_retries = int(os.environ.get("WEBHOOK_MAX_RETRIES", 5))
    webhook_delay_if_failed = int(os.environ.get("WEBHOOK_DELAY_IF_FAILED", 5))

    polygon_mainnet = PolygonMainnetConfig
    polygon_mumbai = PolygonMumbaiConfig

    postgres_config = Postgres
    cron_config = CronConfig
    storage_config = StorageConfig
