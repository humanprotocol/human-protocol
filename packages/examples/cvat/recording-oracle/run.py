import uvicorn
from human_protocol_sdk.constants import KVStoreKeys
from human_protocol_sdk.kvstore import KVStoreClient

from src.chain.web3 import get_web3
from src.core.config import Config


def set_public_key_to_kvstore() -> None:
    if Config.encryption_config.pgp_public_key_url:
        w3 = get_web3(Config.polygon_amoy.chain_id)
        kvstore_client = KVStoreClient(w3)

        if not kvstore_client.get_public_key(Config.polygon_amoy.addr):
            kvstore_client.set_file_url_and_hash(
                Config.encryption_config.pgp_public_key_url,
                key=KVStoreKeys.public_key.value,
            )


if __name__ == "__main__":
    is_dev = Config.environment == "development"

    Config.validate()
    set_public_key_to_kvstore()

    uvicorn.run(
        app="src:app",
        host="0.0.0.0",
        port=int(Config.port),
        workers=Config.workers_amount,
        reload=is_dev,
    )
