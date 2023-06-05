# pylint: disable=too-few-public-methods,missing-class-docstring
""" Project configuration from env vars """
import os
from dotenv import load_dotenv

load_dotenv()


def str_to_bool(val: str) -> bool:
    return val is True or val == "True"


class Postgres:
    port = os.environ.get("PG_PORT", "5432")
    host = os.environ.get("PG_HOST", "0.0.0.0")
    user = os.environ.get("PG_USER", "admin")
    password = os.environ.get("PG_PASSWORD", "admin")
    database = os.environ.get("PG_DB", "exchange_oracle")

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
    process_incoming_webhooks_int = int(
        os.environ.get("PROCESS_INCOMING_WEBHOOKS_INT", 3000)
    )
    process_incoming_webhooks_chunk_size = os.environ.get(
        "PROCESS_INCOMING_WEBHOOKS_CHUNK_SIZE", 5
    )


class CvatConfig:
    cvat_url = os.environ.get("CVAT_URL", "http://localhost:8080")
    cvat_admin = os.environ.get("CVAT_ADMIN", "admin")
    cvat_admin_pass = os.environ.get("CVAT_ADMIN_PASS", "admin")
    cvat_admin_user_id = int(os.environ.get("CVAT_ADMIN_USER_ID", 1))

    cvat_job_overlap = int(os.environ.get("CVAT_JOB_OVERLAP", 0))
    cvat_job_segment_size = int(os.environ.get("CVAT_JOB_SEGMENT_SIZE", 150))
    cvat_default_image_quality = int(os.environ.get("CVAT_DEFAULT_IMAGE_QUALITY", 70))

    cvat_incoming_webhooks_url = os.environ.get("CVAT_INCOMING_WEBHOOKS_URL")


class Config:
    port = int(os.environ.get("PORT", 8000))
    environment = os.environ.get("ENVIRONMENT", "development")
    workers_amount = int(os.environ.get("WORKERS_AMOUNT", 1))

    polygon_mainnet = PolygonMainnetConfig
    polygon_mumbai = PolygonMumbaiConfig

    postgres_config = Postgres
    cron_config = CronConfig
    cvat_config = CvatConfig
