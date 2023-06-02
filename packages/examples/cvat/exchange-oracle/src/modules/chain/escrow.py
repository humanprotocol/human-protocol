import json

from human_protocol_sdk.escrow import EscrowClient
from human_protocol_sdk.storage import StorageClient

from src.modules.chain.web3 import get_web3


def get_escrow_manifest(network: str, escrow_address: str):
    web3 = get_web3(network)
    escrow_client = EscrowClient(web3)

    manifest_url = escrow_client.get_manifest_url(escrow_address)

    return json.loads(
        (StorageClient.download_file_from_url(manifest_url)).decode("utf-8")
    )
