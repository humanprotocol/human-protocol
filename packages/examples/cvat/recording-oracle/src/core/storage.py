from src.core.config import Config
from src.core.types import Networks


def compose_data_bucket_prefix(escrow_address: str, chain_id: Networks):
    return f"{escrow_address}@{chain_id}"


def compose_results_bucket_prefix(escrow_address: str, chain_id: Networks):
    return f"{escrow_address}@{chain_id}{Config.exchange_oracle_storage_config.results_dir_suffix}"


def compose_data_bucket_filename(escrow_address: str, chain_id: Networks, filename: str) -> str:
    return f"{compose_data_bucket_prefix(escrow_address, chain_id)}/{filename}"


def compose_results_bucket_filename(escrow_address: str, chain_id: Networks, filename: str) -> str:
    return f"{compose_results_bucket_prefix(escrow_address, chain_id)}/{filename}"
