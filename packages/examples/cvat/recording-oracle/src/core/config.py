# pylint: disable=too-few-public-methods,missing-class-docstring
""" Project configuration from env vars """
import os
from typing import ClassVar, Optional

from attrs.converters import to_bool
from dotenv import load_dotenv

from src.utils.logging import parse_log_level
from src.utils.net import is_ipv4


dotenv_path = os.getenv("DOTENV_PATH", None)
if dotenv_path and not os.path.exists(dotenv_path):
    raise FileNotFoundError(dotenv_path)

load_dotenv(dotenv_path)


class Postgres:
    port = os.environ.get("PG_PORT", "5434")
    host = os.environ.get("PG_HOST", "0.0.0.0")
    user = os.environ.get("PG_USER", "admin")
    password = os.environ.get("PG_PASSWORD", "admin")
    database = os.environ.get("PG_DB", "recording_oracle")
    lock_timeout = int(os.environ.get("PG_LOCK_TIMEOUT", "3000"))  # milliseconds

    @classmethod
    def connection_url(cls):
        return f"postgresql://{cls.user}:{cls.password}@{cls.host}:{cls.port}/{cls.database}"


class PolygonMainnetConfig:
    chain_id = 137
    rpc_api = os.environ.get("POLYGON_MAINNET_RPC_API_URL")
    private_key = os.environ.get("POLYGON_MAINNET_PRIVATE_KEY")
    addr = os.environ.get("POLYGON_MAINNET_ADDR")


class PolygonAmoyConfig:
    chain_id = 80002
    rpc_api = os.environ.get("POLYGON_AMOY_RPC_API_URL")
    private_key = os.environ.get("POLYGON_AMOY_PRIVATE_KEY")
    addr = os.environ.get("POLYGON_AMOY_ADDR")


class LocalhostConfig:
    chain_id = 1338
    rpc_api = os.environ.get("LOCALHOST_RPC_API_URL", "http://blockchain-node:8545")
    private_key = os.environ.get(
        "LOCALHOST_PRIVATE_KEY",
        "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    )
    addr = os.environ.get("LOCALHOST_AMOY_ADDR", "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")

    exchange_oracle_url = os.environ.get("LOCALHOST_EXCHANGE_ORACLE_URL")
    reputation_oracle_url = os.environ.get("LOCALHOST_REPUTATION_ORACLE_URL")


class CronConfig:
    process_exchange_oracle_webhooks_int = int(
        os.environ.get("PROCESS_EXCHANGE_ORACLE_WEBHOOKS_INT", 3000)
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


class IStorageConfig:
    provider: ClassVar[str]
    data_bucket_name: ClassVar[str]
    secure: ClassVar[bool]
    endpoint_url: ClassVar[str]  # TODO: probably should be optional
    region: ClassVar[Optional[str]]
    # AWS S3 specific attributes
    access_key: ClassVar[Optional[str]]
    secret_key: ClassVar[Optional[str]]
    # GCS specific attributes
    key_file_path: ClassVar[Optional[str]]

    @classmethod
    def get_scheme(cls) -> str:
        return "https://" if cls.secure else "http://"

    @classmethod
    def provider_endpoint_url(cls) -> str:
        return f"{cls.get_scheme()}{cls.endpoint_url}"

    @classmethod
    def bucket_url(cls) -> str:
        if is_ipv4(cls.endpoint_url):
            return f"{cls.get_scheme()}{cls.endpoint_url}/{cls.data_bucket_name}/"
        else:
            return f"{cls.get_scheme()}{cls.data_bucket_name}.{cls.endpoint_url}/"


class StorageConfig(IStorageConfig):
    provider = os.environ["STORAGE_PROVIDER"].lower()
    endpoint_url = os.environ["STORAGE_ENDPOINT_URL"]  # TODO: probably should be optional
    region = os.environ.get("STORAGE_REGION")
    data_bucket_name = os.environ["STORAGE_RESULTS_BUCKET_NAME"]
    secure = to_bool(os.environ.get("STORAGE_USE_SSL", "true"))

    # AWS S3 specific attributes
    access_key = os.environ.get("STORAGE_ACCESS_KEY")
    secret_key = os.environ.get("STORAGE_SECRET_KEY")

    # GCS specific attributes
    key_file_path = os.environ.get("STORAGE_KEY_FILE_PATH")


class ExchangeOracleStorageConfig(IStorageConfig):
    # common attributes
    provider = os.environ["EXCHANGE_ORACLE_STORAGE_PROVIDER"].lower()
    endpoint_url = os.environ[
        "EXCHANGE_ORACLE_STORAGE_ENDPOINT_URL"
    ]  # TODO: probably should be optional
    region = os.environ.get("EXCHANGE_ORACLE_STORAGE_REGION")
    data_bucket_name = os.environ["EXCHANGE_ORACLE_STORAGE_RESULTS_BUCKET_NAME"]
    results_dir_suffix = os.environ.get("STORAGE_RESULTS_DIR_SUFFIX", "-results")
    secure = to_bool(os.environ.get("EXCHANGE_ORACLE_STORAGE_USE_SSL", "true"))
    # AWS S3 specific attributes
    access_key = os.environ.get("EXCHANGE_ORACLE_STORAGE_ACCESS_KEY")
    secret_key = os.environ.get("EXCHANGE_ORACLE_STORAGE_SECRET_KEY")
    # GCS specific attributes
    key_file_path = os.environ.get("EXCHANGE_ORACLE_STORAGE_KEY_FILE_PATH")


class FeaturesConfig:
    enable_custom_cloud_host = to_bool(os.environ.get("ENABLE_CUSTOM_CLOUD_HOST", "no"))
    "Allows using a custom host in manifest bucket urls"


class ValidationConfig:
    default_point_validity_relative_radius = float(
        os.environ.get("DEFAULT_POINT_VALIDITY_RELATIVE_RADIUS", 0.9)
    )

    default_oks_sigma = float(
        os.environ.get("DEFAULT_OKS_SIGMA", 0.1)  # average value for COCO points
    )
    "Default OKS sigma for GT skeleton points validation. Valid range is (0; 1]"

    gt_failure_threshold = float(os.environ.get("GT_FAILURE_THRESHOLD", 0.9))
    """
    The maximum allowed fraction of failed assignments per GT sample,
    before it's considered failed for the current validation iteration.
    v = 0 -> any GT failure leads to image failure
    v = 1 -> any GT failures do not lead to image failure
    """

    gt_ban_threshold = int(os.environ.get("GT_BAN_THRESHOLD", 3))
    """
    The maximum allowed number of failures per GT sample before it's excluded from validation
    """

    unverifiable_assignments_threshold = float(
        os.environ.get("UNVERIFIABLE_ASSIGNMENTS_THRESHOLD", 0.1)
    )
    """
    The maximum allowed fraction of jobs with insufficient GT available for validation.
    Each such job will be accepted "blindly", as we can't validate the annotations.
    """

    max_escrow_iterations = int(os.getenv("MAX_ESCROW_ITERATIONS", 0))
    """
    Maximum escrow annotation-validation iterations.
    After this, the escrow is finished automatically.
    Supposed only for testing. Use 0 to disable.
    """


class Config:
    port = int(os.environ.get("PORT", 8000))
    environment = os.environ.get("ENVIRONMENT", "development")
    workers_amount = int(os.environ.get("WORKERS_AMOUNT", 1))
    webhook_max_retries = int(os.environ.get("WEBHOOK_MAX_RETRIES", 5))
    webhook_delay_if_failed = int(os.environ.get("WEBHOOK_DELAY_IF_FAILED", 60))
    loglevel = parse_log_level(os.environ.get("LOGLEVEL", "info"))

    polygon_mainnet = PolygonMainnetConfig
    polygon_amoy = PolygonAmoyConfig
    localhost = LocalhostConfig

    postgres_config = Postgres
    cron_config = CronConfig
    storage_config = StorageConfig
    exchange_oracle_storage_config = ExchangeOracleStorageConfig

    features = FeaturesConfig
    validation = ValidationConfig
