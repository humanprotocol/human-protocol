# pylint: disable=too-few-public-methods,missing-class-docstring
"""Project configuration from env vars"""

import inspect
import os
from collections.abc import Iterable
from os import getenv
from typing import ClassVar

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


class _BaseConfig:
    @classmethod
    def validate(cls) -> None:
        pass


class Postgres:
    port = getenv("PG_PORT", "5434")
    host = getenv("PG_HOST", "0.0.0.0")  # noqa: S104
    user = getenv("PG_USER", "admin")
    password = getenv("PG_PASSWORD", "admin")
    database = getenv("PG_DB", "recording_oracle")
    lock_timeout = int(getenv("PG_LOCK_TIMEOUT", "3000"))  # milliseconds

    @classmethod
    def connection_url(cls) -> str:
        return f"postgresql://{cls.user}:{cls.password}@{cls.host}:{cls.port}/{cls.database}"


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

    exchange_oracle_url = getenv("LOCALHOST_EXCHANGE_ORACLE_URL")
    reputation_oracle_url = getenv("LOCALHOST_REPUTATION_ORACLE_URL")


class CronConfig:
    process_exchange_oracle_webhooks_int = int(getenv("PROCESS_EXCHANGE_ORACLE_WEBHOOKS_INT", 3000))
    process_exchange_oracle_webhooks_chunk_size = int(
        getenv("PROCESS_EXCHANGE_ORACLE_WEBHOOKS_CHUNK_SIZE", 5)
    )
    process_reputation_oracle_webhooks_int = int(
        getenv("PROCESS_REPUTATION_ORACLE_WEBHOOKS_INT", 3000)
    )
    process_reputation_oracle_webhooks_chunk_size = int(
        getenv("PROCESS_REPUTATION_ORACLE_WEBHOOKS_CHUNK_SIZE", 5)
    )


class IStorageConfig:
    provider: ClassVar[str]
    data_bucket_name: ClassVar[str]
    secure: ClassVar[bool]
    endpoint_url: ClassVar[str]  # TODO: probably should be optional
    # AWS S3 specific attributes
    access_key: ClassVar[str | None]
    secret_key: ClassVar[str | None]
    # GCS specific attributes
    key_file_path: ClassVar[str | None]

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
        return f"{cls.get_scheme()}{cls.data_bucket_name}.{cls.endpoint_url}/"


class StorageConfig(IStorageConfig):
    provider = os.environ["STORAGE_PROVIDER"].lower()
    endpoint_url = os.environ["STORAGE_ENDPOINT_URL"]  # TODO: probably should be optional
    data_bucket_name = os.environ["STORAGE_RESULTS_BUCKET_NAME"]
    secure = to_bool(getenv("STORAGE_USE_SSL", "true"))

    # AWS S3 specific attributes
    access_key = getenv("STORAGE_ACCESS_KEY")
    secret_key = getenv("STORAGE_SECRET_KEY")

    # GCS specific attributes
    key_file_path = getenv("STORAGE_KEY_FILE_PATH")


class ExchangeOracleStorageConfig(IStorageConfig):
    # common attributes
    provider = os.environ["EXCHANGE_ORACLE_STORAGE_PROVIDER"].lower()
    endpoint_url = os.environ[
        "EXCHANGE_ORACLE_STORAGE_ENDPOINT_URL"
    ]  # TODO: probably should be optional
    data_bucket_name = os.environ["EXCHANGE_ORACLE_STORAGE_RESULTS_BUCKET_NAME"]
    results_dir_suffix = getenv("STORAGE_RESULTS_DIR_SUFFIX", "-results")
    secure = to_bool(getenv("EXCHANGE_ORACLE_STORAGE_USE_SSL", "true"))
    # AWS S3 specific attributes
    access_key = getenv("EXCHANGE_ORACLE_STORAGE_ACCESS_KEY")
    secret_key = getenv("EXCHANGE_ORACLE_STORAGE_SECRET_KEY")
    # GCS specific attributes
    key_file_path = getenv("EXCHANGE_ORACLE_STORAGE_KEY_FILE_PATH")


class FeaturesConfig:
    enable_custom_cloud_host = to_bool(getenv("ENABLE_CUSTOM_CLOUD_HOST", "no"))
    "Allows using a custom host in manifest bucket urls"


class ValidationConfig:
    gt_ban_threshold = int(getenv("GT_BAN_THRESHOLD", 3))
    """
    The maximum allowed number of failures per GT sample before it's excluded from validation
    """

    unverifiable_assignments_threshold = float(getenv("UNVERIFIABLE_ASSIGNMENTS_THRESHOLD", 0.1))
    """
    Deprecated. Not expected to happen in practice, kept only as a safety fallback rule.

    The maximum allowed fraction of jobs with insufficient GT available for validation.
    Each such job will be accepted "blindly", as we can't validate the annotations.
    """

    max_escrow_iterations = int(getenv("MAX_ESCROW_ITERATIONS", "0"))
    """
    Maximum escrow annotation-validation iterations.
    After this, the escrow is finished automatically.
    Supposed only for testing. Use 0 to disable.
    """


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


class CvatConfig:
    host_url = getenv("CVAT_URL", "http://localhost:8080")
    admin_login = getenv("CVAT_ADMIN", "admin")
    admin_pass = getenv("CVAT_ADMIN_PASS", "admin")
    org_slug = getenv("CVAT_ORG_SLUG", "org1")

    quality_retrieval_timeout = int(getenv("CVAT_QUALITY_RETRIEVAL_TIMEOUT", 60 * 60))
    quality_check_interval = int(getenv("CVAT_QUALITY_CHECK_INTERVAL", 5))


class Config:
    port = int(getenv("PORT", 8000))
    environment = getenv("ENVIRONMENT", "development")
    workers_amount = int(getenv("WORKERS_AMOUNT", 1))
    webhook_max_retries = int(getenv("WEBHOOK_MAX_RETRIES", 5))
    webhook_delay_if_failed = int(getenv("WEBHOOK_DELAY_IF_FAILED", 60))
    loglevel = parse_log_level(getenv("LOGLEVEL", "info"))

    polygon_mainnet = PolygonMainnetConfig
    polygon_amoy = PolygonAmoyConfig
    localhost = LocalhostConfig

    postgres_config = Postgres
    cron_config = CronConfig
    storage_config = StorageConfig
    exchange_oracle_storage_config = ExchangeOracleStorageConfig

    features = FeaturesConfig
    validation = ValidationConfig
    encryption_config = EncryptionConfig
    cvat_config = CvatConfig

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
