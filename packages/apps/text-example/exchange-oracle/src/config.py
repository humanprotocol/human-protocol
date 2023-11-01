""" Project configuration from env vars """
import os
from pydantic import BaseModel
from dotenv import load_dotenv
from minio import Minio
from pathlib import Path

if not load_dotenv():
    raise IOError("Could not read dotenv file.")


def str_to_bool(val: str) -> bool:
    return val is True or val == "True"


class Postgres:
    port = os.environ.get("PG_PORT")
    host = os.environ.get("PG_HOST")
    user = os.environ.get("PG_USER")
    password = os.environ.get("PG_PASSWORD")
    database = os.environ.get("PG_DB")

    @classmethod
    def connection_url(cls):
        return f"postgresql://{Postgres.user}:{Postgres.password}@{Postgres.host}:{Postgres.port}/{Postgres.database}"


class BlockChainConfig(BaseModel):
    chain_id: int
    rpc_api: str
    private_key: str
    addr: str


PolygonMainnetConfig = BlockChainConfig(
    chain_id=137,
    rpc_api=os.environ.get("POLYGON_MAINNET_RPC_API_URL"),
    private_key=os.environ.get("POLYGON_MAINNET_PRIVATE_KEY"),
    addr=os.environ.get("POLYGON_MAINNET_ADDR"),
)

PolygonMumbaiConfig = BlockChainConfig(
    chain_id=80001,
    rpc_api=os.environ.get("POLYGON_MUMBAI_RPC_API_URL"),
    private_key=os.environ.get("POLYGON_MUMBAI_PRIVATE_KEY"),
    addr=os.environ.get("POLYGON_MUMBAI_ADDR"),
)

LocalhostConfig = BlockChainConfig(
    chain_id=1338,
    rpc_api=os.environ.get("LOCALHOST_RPC_API_URL", "http://blockchain-node:8545"),
    private_key=os.environ.get(
        "LOCALHOST_PRIVATE_KEY",
        "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    ),
    addr=os.environ.get(
        "LOCALHOST_MUMBAI_ADDR", "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
    ),
)


class CronConfig:
    task_interval = int(os.environ.get("BACKGROUND_TASK_INTERVAL"))
    task_chunk_size = int(os.environ.get("BACKGROUND_TASK_CHUNK_SIZE"))


class StorageConfig:
    endpoint_url = os.environ.get("S3_ENDPOINT_URL")
    region = os.environ.get("S3_REGION", "")
    access_key = os.environ.get("S3_ACCESS_KEY")
    secret_key = os.environ.get("S3_SECRET_KEY")
    results_bucket_name = os.environ.get("S3_RESULTS_BUCKET_NAME", "")
    secure = bool(int(os.environ.get("S3_USE_SSL")))
    dataset_dir = Path(os.environ.get("LOCAL_DATA_DIR"))

    @classmethod
    def client(cls) -> Minio:
        return Minio(
            endpoint=cls.endpoint_url,
            region=cls.region,
            access_key=cls.access_key,
            secret_key=cls.secret_key,
            secure=cls.secure,
        )


class DoccanoConfig:
    host = os.environ.get("DOCCANO_HOST")
    port = os.environ.get("DOCCANO_PORT")
    ssl = bool(int(os.environ.get("DOCCANO_USE_SSL")))
    admin = os.environ.get("DOCCANO_ADMIN")
    password = os.environ.get("DOCCANO_ADMIN_PASS")
    tasks_per_worker = int(os.environ.get("DOCCANO_TASKS_PER_WORKER"))

    @classmethod
    def url(cls):
        return f"{cls.host}:{cls.port}"


class Config:
    port = int(os.environ.get("PORT"))
    environment = os.environ.get("ENVIRONMENT")
    workers_amount = int(os.environ.get("WORKERS_AMOUNT"))
    webhook_max_retries = int(os.environ.get("WEBHOOK_MAX_RETRIES"))
    webhook_delay_if_failed = int(os.environ.get("WEBHOOK_DELAY_IF_FAILED"))

    polygon_mainnet = PolygonMainnetConfig
    polygon_mumbai = PolygonMumbaiConfig
    localhost = LocalhostConfig

    postgres_config = Postgres
    cron_config = CronConfig
    storage_config = StorageConfig

    doccano = DoccanoConfig
