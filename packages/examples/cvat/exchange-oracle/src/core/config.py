# pylint: disable=too-few-public-methods,missing-class-docstring
""" Project configuration from env vars """
import os

from dotenv import load_dotenv

from src.utils.logging import parse_log_level
from src.utils.net import is_ipv4

load_dotenv()


def str_to_bool(val: str) -> bool:
    from distutils.util import strtobool

    return val is True or strtobool(val)


class PostgresConfig:
    port = os.environ.get("PG_PORT", "5432")
    host = os.environ.get("PG_HOST", "0.0.0.0")
    user = os.environ.get("PG_USER", "admin")
    password = os.environ.get("PG_PASSWORD", "admin")
    database = os.environ.get("PG_DB", "exchange_oracle")
    lock_timeout = int(os.environ.get("PG_LOCK_TIMEOUT", "3000"))  # milliseconds

    @classmethod
    def connection_url(cls):
        return f"postgresql://{cls.user}:{cls.password}@{cls.host}:{cls.port}/{cls.database}"


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


class LocalhostConfig:
    chain_id = 1338
    rpc_api = os.environ.get("LOCALHOST_RPC_API_URL", "http://blockchain-node:8545")
    private_key = os.environ.get(
        "LOCALHOST_PRIVATE_KEY",
        "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    )
    addr = os.environ.get("LOCALHOST_MUMBAI_ADDR", "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")

    job_launcher_url = os.environ.get("LOCALHOST_JOB_LAUNCHER_URL")
    recording_oracle_url = os.environ.get("LOCALHOST_RECORDING_ORACLE_URL")


class CronConfig:
    process_job_launcher_webhooks_int = int(os.environ.get("PROCESS_JOB_LAUNCHER_WEBHOOKS_INT", 30))
    process_job_launcher_webhooks_chunk_size = os.environ.get(
        "PROCESS_JOB_LAUNCHER_WEBHOOKS_CHUNK_SIZE", 5
    )
    process_recording_oracle_webhooks_int = int(
        os.environ.get("PROCESS_RECORDING_ORACLE_WEBHOOKS_INT", 30)
    )
    process_recording_oracle_webhooks_chunk_size = os.environ.get(
        "PROCESS_RECORDING_ORACLE_WEBHOOKS_CHUNK_SIZE", 5
    )
    track_completed_projects_int = int(os.environ.get("TRACK_COMPLETED_PROJECTS_INT", 30))
    track_completed_projects_chunk_size = os.environ.get("TRACK_COMPLETED_PROJECTS_CHUNK_SIZE", 5)
    track_completed_tasks_int = int(os.environ.get("TRACK_COMPLETED_TASKS_INT", 30))
    track_creating_tasks_chunk_size = os.environ.get("TRACK_CREATING_TASKS_CHUNK_SIZE", 5)
    track_creating_tasks_int = int(os.environ.get("TRACK_CREATING_TASKS_INT", 300))
    track_assignments_int = int(os.environ.get("TRACK_ASSIGNMENTS_INT", 5))
    track_assignments_chunk_size = os.environ.get("TRACK_ASSIGNMENTS_CHUNK_SIZE", 10)

    retrieve_annotations_int = int(os.environ.get("RETRIEVE_ANNOTATIONS_INT", 60))
    retrieve_annotations_chunk_size = os.environ.get("RETRIEVE_ANNOTATIONS_CHUNK_SIZE", 5)


class CvatConfig:
    cvat_url = os.environ.get("CVAT_URL", "http://localhost:8080")
    cvat_admin = os.environ.get("CVAT_ADMIN", "admin")
    cvat_admin_pass = os.environ.get("CVAT_ADMIN_PASS", "admin")
    cvat_org_slug = os.environ.get("CVAT_ORG_SLUG", "")

    cvat_job_overlap = int(os.environ.get("CVAT_JOB_OVERLAP", 0))
    cvat_job_segment_size = int(os.environ.get("CVAT_JOB_SEGMENT_SIZE", 150))
    cvat_default_image_quality = int(os.environ.get("CVAT_DEFAULT_IMAGE_QUALITY", 70))

    cvat_incoming_webhooks_url = os.environ.get("CVAT_INCOMING_WEBHOOKS_URL")
    cvat_webhook_secret = os.environ.get("CVAT_WEBHOOK_SECRET", "thisisasamplesecret")


class StorageConfig:
    endpoint_url = os.environ.get("STORAGE_ENDPOINT_URL", "storage.googleapis.com")
    region = os.environ.get("STORAGE_REGION", "")
    access_key = os.environ.get("STORAGE_ACCESS_KEY", "")
    secret_key = os.environ.get("STORAGE_SECRET_KEY", "")
    results_bucket_name = os.environ.get("STORAGE_RESULTS_BUCKET_NAME", "")
    secure = str_to_bool(os.environ.get("STORAGE_USE_SSL", "true"))

    @classmethod
    def provider_endpoint_url(cls):
        scheme = "https://" if cls.secure else "http://"

        return f"{scheme}{cls.endpoint_url}"

    @classmethod
    def bucket_url(cls):
        scheme = "https://" if cls.secure else "http://"

        if is_ipv4(cls.endpoint_url):
            return f"{scheme}{cls.endpoint_url}/{cls.results_bucket_name}/"
        else:
            return f"{scheme}{cls.results_bucket_name}.{cls.endpoint_url}/"


class FeaturesConfig:
    enable_custom_cloud_host = str_to_bool(os.environ.get("ENABLE_CUSTOM_CLOUD_HOST", "no"))
    "Allows using a custom host in manifest bucket urls"

    default_export_timeout = int(os.environ.get("DEFAULT_EXPORT_TIMEOUT", 60))
    "Timeout, in seconds, for annotations or dataset export waiting"


class CoreConfig:
    default_assignment_time = int(os.environ.get("DEFAULT_ASSIGNMENT_TIME", 300))


class HumanAppConfig:
    signature = os.environ.get("HUMAN_APP_SIGNATURE", "sample")


class Config:
    port = int(os.environ.get("PORT", 8000))
    environment = os.environ.get("ENVIRONMENT", "development")
    workers_amount = int(os.environ.get("WORKERS_AMOUNT", 1))
    webhook_max_retries = int(os.environ.get("WEBHOOK_MAX_RETRIES", 5))
    webhook_delay_if_failed = int(os.environ.get("WEBHOOK_DELAY_IF_FAILED", 60))
    loglevel = parse_log_level(os.environ.get("LOGLEVEL", "info"))

    polygon_mainnet = PolygonMainnetConfig
    polygon_mumbai = PolygonMumbaiConfig
    localhost = LocalhostConfig

    postgres_config = PostgresConfig
    human_app_config = HumanAppConfig

    cron_config = CronConfig
    cvat_config = CvatConfig
    storage_config = StorageConfig
    features = FeaturesConfig
    core_config = CoreConfig
