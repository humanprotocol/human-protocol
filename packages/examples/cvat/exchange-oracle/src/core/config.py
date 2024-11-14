# pylint: disable=too-few-public-methods,missing-class-docstring
"""Project configuration from env vars"""

import inspect
import os
from collections.abc import Iterable
from enum import Enum
from os import getenv
from typing import ClassVar, Optional

from attrs.converters import to_bool
from dotenv import load_dotenv
from human_protocol_sdk.encryption import Encryption
from web3 import Web3
from web3.providers.rpc import HTTPProvider

from src.utils.logging import parse_log_level
from src.utils.net import is_ipv4

dotenv_path = getenv("DOTENV_PATH", None)
if dotenv_path and not os.path.exists(dotenv_path):  # noqa: PTH110
    raise FileNotFoundError(dotenv_path)

load_dotenv(dotenv_path)


# TODO: add some logic to report unused/deprecated env vars on startup


class _BaseConfig:
    @classmethod
    def validate(cls) -> None:
        pass


class PostgresConfig:
    port = getenv("PG_PORT", "5432")
    host = getenv("PG_HOST", "0.0.0.0")  # noqa: S104
    user = getenv("PG_USER", "admin")
    password = getenv("PG_PASSWORD", "admin")
    database = getenv("PG_DB", "exchange_oracle")
    lock_timeout = int(getenv("PG_LOCK_TIMEOUT", "3000"))  # milliseconds

    @classmethod
    def connection_url(cls) -> str:
        return f"postgresql://{cls.user}:{cls.password}@{cls.host}:{cls.port}/{cls.database}"


class RedisConfig:
    port = getenv("REDIS_PORT", "6379")
    host = getenv("REDIS_HOST", "0.0.0.0")  # noqa: S104
    database = getenv("REDIS_DB", "")
    user = getenv("REDIS_USER", "")
    password = getenv("REDIS_PASSWORD", "")
    use_ssl = to_bool(getenv("REDIS_USE_SSL", "false"))

    @classmethod
    def connection_url(cls) -> str:
        scheme = "redis"
        if cls.use_ssl:
            scheme += "s"

        auth_params = ""
        if cls.user or cls.password:
            auth_params = f"{cls.user}:{cls.password}@"

        return f"{scheme}://{auth_params}{cls.host}:{cls.port}/{cls.database}"


class _NetworkConfig:
    chain_id: ClassVar[int]
    rpc_api: ClassVar[str | None]
    private_key: ClassVar[str | None]
    addr: ClassVar[str | None]

    @classmethod
    def is_configured(cls) -> bool:
        if all([cls.chain_id, cls.rpc_api, cls.private_key, cls.addr]):
            w3 = Web3(HTTPProvider(cls.rpc_api))
            return w3.is_connected()

        return False


class PolygonMainnetConfig(_NetworkConfig):
    chain_id = 137
    rpc_api = getenv("POLYGON_MAINNET_RPC_API_URL")
    private_key = getenv("POLYGON_MAINNET_PRIVATE_KEY")
    addr = getenv("POLYGON_MAINNET_ADDR")


class PolygonAmoyConfig(_NetworkConfig):
    chain_id = 80002
    rpc_api = getenv("POLYGON_AMOY_RPC_API_URL")
    private_key = getenv("POLYGON_AMOY_PRIVATE_KEY")
    addr = getenv("POLYGON_AMOY_ADDR")


class LocalhostConfig(_NetworkConfig):
    chain_id = 1338
    rpc_api = getenv("LOCALHOST_RPC_API_URL", "http://blockchain-node:8545")
    private_key = getenv(
        "LOCALHOST_PRIVATE_KEY",
        "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    )
    addr = getenv("LOCALHOST_AMOY_ADDR", "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")

    job_launcher_url = getenv("LOCALHOST_JOB_LAUNCHER_URL")

    recording_oracle_address = getenv("LOCALHOST_RECORDING_ORACLE_ADDRESS")
    recording_oracle_url = getenv("LOCALHOST_RECORDING_ORACLE_URL")

    reputation_oracle_address = getenv("LOCALHOST_REPUTATION_ORACLE_ADDRESS")
    reputation_oracle_url = getenv("LOCALHOST_REPUTATION_ORACLE_URL")


class CronConfig:
    process_job_launcher_webhooks_int = int(getenv("PROCESS_JOB_LAUNCHER_WEBHOOKS_INT", 30))
    process_job_launcher_webhooks_chunk_size = int(
        getenv("PROCESS_JOB_LAUNCHER_WEBHOOKS_CHUNK_SIZE", 5)
    )
    process_recording_oracle_webhooks_int = int(getenv("PROCESS_RECORDING_ORACLE_WEBHOOKS_INT", 30))
    process_recording_oracle_webhooks_chunk_size = int(
        getenv("PROCESS_RECORDING_ORACLE_WEBHOOKS_CHUNK_SIZE", 5)
    )
    process_reputation_oracle_webhooks_chunk_size = int(
        getenv("PROCESS_REPUTATION_ORACLE_WEBHOOKS_CHUNK_SIZE", 5)
    )
    process_reputation_oracle_webhooks_int = int(
        getenv("PROCESS_REPUTATION_ORACLE_WEBHOOKS_INT", 5)
    )
    track_completed_projects_int = int(getenv("TRACK_COMPLETED_PROJECTS_INT", 30))
    track_completed_tasks_int = int(getenv("TRACK_COMPLETED_TASKS_INT", 30))
    track_creating_tasks_int = int(getenv("TRACK_CREATING_TASKS_INT", 300))
    track_creating_tasks_chunk_size = getenv("TRACK_CREATING_TASKS_CHUNK_SIZE", 5)
    track_assignments_int = int(getenv("TRACK_ASSIGNMENTS_INT", 5))
    track_assignments_chunk_size = getenv("TRACK_ASSIGNMENTS_CHUNK_SIZE", 10)

    track_completed_escrows_int = int(getenv("TRACK_COMPLETED_ESCROWS_INT", 60))
    track_completed_escrows_chunk_size = int(getenv("TRACK_COMPLETED_ESCROWS_CHUNK_SIZE", 5))
    track_escrow_validations_int = int(getenv("TRACK_ESCROW_VALIDATIONS_INT", 60))
    track_completed_escrows_max_downloading_retries = int(
        getenv("TRACK_COMPLETED_ESCROWS_MAX_DOWNLOADING_RETRIES", 10)
    )
    "Maximum number of downloading attempts per job during results downloading"

    track_completed_escrows_jobs_downloading_batch_size = int(
        getenv("TRACK_COMPLETED_ESCROWS_JOBS_DOWNLOADING_BATCH_SIZE", 500)
    )
    "Maximum number of parallel downloading requests during results downloading"

    process_rejected_projects_chunk_size = getenv("REJECTED_PROJECTS_CHUNK_SIZE", 20)
    process_accepted_projects_chunk_size = getenv("ACCEPTED_PROJECTS_CHUNK_SIZE", 20)

    track_escrow_creation_chunk_size = getenv("TRACK_ESCROW_CREATION_CHUNK_SIZE", 20)
    track_escrow_creation_int = int(getenv("TRACK_ESCROW_CREATION_INT", 300))


class CvatConfig:
    host_url = getenv("CVAT_URL", "http://localhost:8080")
    admin_login = getenv("CVAT_ADMIN", "admin")
    admin_pass = getenv("CVAT_ADMIN_PASS", "admin")
    org_slug = getenv("CVAT_ORG_SLUG", "")

    cvat_job_overlap = int(getenv("CVAT_JOB_OVERLAP", 0))
    cvat_task_segment_size = int(getenv("CVAT_TASK_SEGMENT_SIZE", 150))
    cvat_default_image_quality = int(getenv("CVAT_DEFAULT_IMAGE_QUALITY", 70))
    cvat_max_jobs_per_task = int(getenv("CVAT_MAX_JOBS_PER_TASK", 1000))
    cvat_task_creation_check_interval = int(getenv("CVAT_TASK_CREATION_CHECK_INTERVAL", 5))

    export_timeout = int(getenv("CVAT_EXPORT_TIMEOUT", 5 * 60))
    "Timeout, in seconds, for annotations or dataset export waiting"

    import_timeout = int(getenv("CVAT_IMPORT_TIMEOUT", 60 * 60))
    "Timeout, in seconds, for waiting on GT annotations import"

    # quality control settings
    max_validation_checks = int(getenv("CVAT_MAX_VALIDATION_CHECKS", 3))
    "Maximum number of attempts to run a validation check on a job after completing annotation"

    iou_threshold = float(getenv("CVAT_IOU_THRESHOLD", 0.8))
    oks_sigma = float(getenv("CVAT_OKS_SIGMA", 0.1))

    incoming_webhooks_url = getenv("CVAT_INCOMING_WEBHOOKS_URL")
    webhook_secret = getenv("CVAT_WEBHOOK_SECRET", "thisisasamplesecret")


class StorageConfig:
    provider: ClassVar[str] = os.environ["STORAGE_PROVIDER"].lower()
    data_bucket_name: ClassVar[str] = (
        getenv("STORAGE_RESULTS_BUCKET_NAME")  # backward compatibility
        or os.environ["STORAGE_BUCKET_NAME"]
    )
    endpoint_url: ClassVar[str] = os.environ[
        "STORAGE_ENDPOINT_URL"
    ]  # TODO: probably should be optional
    results_dir_suffix: ClassVar[str] = getenv("STORAGE_RESULTS_DIR_SUFFIX", "-results")
    secure: ClassVar[bool] = to_bool(getenv("STORAGE_USE_SSL", "true"))

    # S3 specific attributes
    access_key: ClassVar[str | None] = getenv("STORAGE_ACCESS_KEY")
    secret_key: ClassVar[str | None] = getenv("STORAGE_SECRET_KEY")

    # GCS specific attributes
    key_file_path: ClassVar[str | None] = getenv("STORAGE_KEY_FILE_PATH")

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


class FeaturesConfig:
    enable_custom_cloud_host = to_bool(getenv("ENABLE_CUSTOM_CLOUD_HOST", "no"))
    "Allows using a custom host in manifest bucket urls"

    request_logging_enabled = to_bool(getenv("REQUEST_LOGGING_ENABLED", "0"))
    "Allow to log request details for each request"

    profiling_enabled = to_bool(getenv("PROFILING_ENABLED", "0"))
    "Allow to profile specific requests"


class CoreConfig:
    default_assignment_time = int(getenv("DEFAULT_ASSIGNMENT_TIME", 1800))

    skeleton_assignment_size_mult = int(getenv("SKELETON_ASSIGNMENT_SIZE_MULT", 1))
    "Assignment size multiplier for image_skeletons_from_boxes tasks"

    min_roi_size_w = int(getenv("MIN_ROI_SIZE_W", 350))
    "Minimum absolute ROI size for image_boxes_from_points and image_skeletons_from_boxes tasks"

    min_roi_size_h = int(getenv("MIN_ROI_SIZE_H", 300))
    "Minimum absolute ROI size for image_boxes_from_points and image_skeletons_from_boxes tasks"


class HumanAppConfig:
    # jwt_public_key is obtained from the Human App.
    # To generate a key pair for testing purposes:
    # openssl ecparam -name prime256v1 -genkey -noout -out ec_private.pem
    # openssl ec -in ec_private.pem -pubout -out ec_public.pem
    # HUMAN_APP_JWT_KEY=$(cat ec_public.pem)
    jwt_public_key = getenv("HUMAN_APP_JWT_KEY")


class ApiConfig:
    default_page_size = int(getenv("DEFAULT_API_PAGE_SIZE", 5))
    min_page_size = int(getenv("MIN_API_PAGE_SIZE", 1))
    max_page_size = int(getenv("MAX_API_PAGE_SIZE", 10))

    stats_rps_limit = int(getenv("STATS_RPS_LIMIT", 4))


class EncryptionConfig(_BaseConfig):
    pgp_passphrase = getenv("PGP_PASSPHRASE", "")
    pgp_private_key = getenv("PGP_PRIVATE_KEY", "")
    pgp_public_key_url = getenv("PGP_PUBLIC_KEY_URL", "")

    @classmethod
    def validate(cls) -> None:
        ex_prefix = "Wrong server configuration."

        if (cls.pgp_public_key_url or cls.pgp_passphrase) and not cls.pgp_private_key:
            raise Exception(f"{ex_prefix} The PGP_PRIVATE_KEY environment is not set.")

        if cls.pgp_private_key:
            try:
                Encryption(cls.pgp_private_key, passphrase=cls.pgp_passphrase)
            except Exception as ex:  # noqa: BLE001
                # Possible reasons:
                # - private key is invalid
                # - private key is locked but no passphrase is provided
                raise Exception(" ".join([ex_prefix, str(ex)]))


class Environment(str, Enum):
    PRODUCTION = "production"
    DEVELOPMENT = "development"
    TEST = "test"

    @classmethod
    def _missing_(cls, value: str) -> Optional["Environment"]:
        value = value.lower()
        for member in cls:
            if member.value == value:
                return member

        return None


class Config:
    debug = to_bool(getenv("DEBUG", "false"))
    port = int(getenv("PORT", 8000))
    environment = Environment(getenv("ENVIRONMENT", Environment.DEVELOPMENT.value))
    workers_amount = int(getenv("WORKERS_AMOUNT", 1))
    webhook_max_retries = int(getenv("WEBHOOK_MAX_RETRIES", 5))
    webhook_delay_if_failed = int(getenv("WEBHOOK_DELAY_IF_FAILED", 60))
    loglevel = parse_log_level(getenv("LOGLEVEL", "info"))

    polygon_mainnet = PolygonMainnetConfig
    polygon_amoy = PolygonAmoyConfig
    localhost = LocalhostConfig

    postgres_config = PostgresConfig
    redis_config = RedisConfig
    api_config = ApiConfig
    human_app_config = HumanAppConfig

    cron_config = CronConfig
    cvat_config = CvatConfig
    storage_config = StorageConfig
    features = FeaturesConfig
    core_config = CoreConfig
    encryption_config = EncryptionConfig

    @classmethod
    def is_development_mode(cls) -> bool:
        """Returns whether the oracle is running in development mode or not"""
        return cls.environment == Environment.DEVELOPMENT

    @classmethod
    def is_test_mode(cls) -> bool:
        """Returns whether the oracle is running in testing mode or not"""
        return cls.environment == Environment.TEST

    @classmethod
    def is_production_mode(cls) -> bool:
        """Returns whether the oracle is running in production mode or not"""
        return cls.environment == Environment.PRODUCTION

    @classmethod
    def validate(cls) -> None:
        for attr_or_method in cls.__dict__:
            attr_or_method = getattr(cls, attr_or_method)
            if inspect.isclass(attr_or_method) and issubclass(attr_or_method, _BaseConfig):
                attr_or_method.validate()

    @classmethod
    def get_network_configs(cls, *, only_configured: bool = True) -> Iterable[_NetworkConfig]:
        for attr_or_method in cls.__dict__:
            attr_or_method = getattr(cls, attr_or_method)
            if (
                inspect.isclass(attr_or_method)
                and issubclass(attr_or_method, _NetworkConfig)
                and (not only_configured or attr_or_method.is_configured())
            ):
                yield attr_or_method
