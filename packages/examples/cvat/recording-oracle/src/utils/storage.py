from src.core.types import Networks


def compose_bucket_filename(escrow_address: str, chain_id: Networks, filename: str) -> str:
    return f"{escrow_address}@{chain_id}/{filename}"
