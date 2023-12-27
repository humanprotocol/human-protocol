""" Project configuration from env vars """
import logging
import os
import sys
from logging.config import dictConfig
from pathlib import Path

from dotenv import load_dotenv
from minio import Minio
from pydantic import BaseModel
from urllib3 import PoolManager


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

    @classmethod
    def results_s3_url(cls, job_id, extension=".jsonl"):
        return "/".join([cls.endpoint_url, cls.results_bucket_name, job_id]) + extension


class LoggingConfig:
    _ready = False
    root_logger_name = "app"
    log_level = os.environ.get("LOG_LEVEL")

    @classmethod
    def get_logger(cls):
        return logging.getLogger(cls.root_logger_name)

    @classmethod
    def setup_logging(cls, force_reset=False):
        if not cls._ready or force_reset:
            log_level_name = logging.getLevelName(
                cls.log_level
                or (
                    logging.DEBUG
                    if Config.environment in ["development", "test"]
                    else logging.INFO
                )
            )

            log_config = {
                "version": 1,
                "disable_existing_loggers": False,
                "formatters": {
                    "default": {
                        "()": "uvicorn.logging.DefaultFormatter",
                        "fmt": "%(levelprefix)s %(asctime)s [%(name)s] %(message)s",
                        "datefmt": "%Y-%m-%d %H:%M:%S",
                        "use_colors": True,
                    },
                },
                "handlers": {
                    "console": {
                        "formatter": "default",
                        "class": "logging.StreamHandler",
                    },
                },
                "loggers": {
                    cls.root_logger_name: {
                        "handlers": ["console"],
                        "level": log_level_name,
                        "propagate": False,
                    },
                },
            }

            dictConfig(log_config)
            logger = cls.get_logger()

            def handle_exception(exc_type, exc_value, exc_traceback):
                if issubclass(exc_type, KeyboardInterrupt):
                    sys.__excepthook__(exc_type, exc_value, exc_traceback)
                    return

                logger.error(
                    "Uncaught exception", exc_info=(exc_type, exc_value, exc_traceback)
                )

            sys.excepthook = handle_exception

            cls._ready = True


class HumanConfig:
    reputation_oracle_url = os.environ.get("REPUTATION_ORACLE_ENDPOINT_URL")
    human_app_signature = os.environ.get("HUMAN_APP_SIGNATURE")
    reputation_oracle_key = os.environ.get("REPUTATION_ORACLE_KEY")


class Config:
    port = int(os.environ.get("PORT"))
    environment = os.environ.get("ENVIRONMENT")
    workers_amount = int(os.environ.get("WORKERS_AMOUNT"))
    default_job_expiry_days = int(os.environ.get("DEFAULT_JOB_EXPIRY_DAYS"))
    max_attempts = int(os.environ.get("MAX_ATTEMPTS"))
    http = PoolManager()

    polygon_mainnet = PolygonMainnetConfig
    polygon_mumbai = PolygonMumbaiConfig
    localhost = LocalhostConfig

    postgres_config = Postgres
    cron_config = CronConfig
    storage_config = StorageConfig
    logging = LoggingConfig
    human = HumanConfig

    @classmethod
    def blockchain_config_from_id(cls, chain_id):
        match chain_id:
            case cls.polygon_mainnet.chain_id:
                return cls.polygon_mainnet
            case cls.polygon_mumbai.chain_id:
                return cls.polygon_mumbai
            case cls.localhost.chain_id:
                return cls.localhost
            case _:
                raise ValueError(f"{chain_id} is not in available list of networks.")


Config.logging.setup_logging()
