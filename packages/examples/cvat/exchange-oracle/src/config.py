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


class NetworkConfig:
    network_id = os.environ.get("BLOCKCHAIN_NETWORK", 1)
    hmt_addr = os.environ.get("HMT_ADDRESS", 1)
    factory_addr = os.environ.get("ESCROW_FACTORY_ADDRESS", 1)
    public_key = os.environ.get("PUBLIC_KEY", 1)
    private_key = os.environ.get("PRIVATE_KEY", 2)


class Config:
    port = int(os.environ.get("PORT", 8000))
    environment = os.environ.get("ENVIRONMENT", "development")
    workers_amount = int(os.environ.get("WORKERS_AMOUNT", 1))

    network_config = NetworkConfig
    postgres_config = Postgres
