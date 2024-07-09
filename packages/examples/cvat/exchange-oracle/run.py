import uvicorn
from human_protocol_sdk.constants import KVStoreKeys
from human_protocol_sdk.kvstore import KVStoreClient, KVStoreClientError

from src.chain.web3 import get_web3
from src.core.config import Config


def set_public_key_to_kvstore() -> None:
    if Config.encryption_config.pgp_public_key_url:
        for network_config in Config.get_network_configs(only_configured=True):
            w3 = get_web3(network_config.chain_id)
            kvstore_client = KVStoreClient(w3)

            is_pub_key_stored = False
            try:
                is_pub_key_stored = kvstore_client.get_public_key(network_config.addr)
            except KVStoreClientError as ex:
                if "Invalid hash" not in str(ex):
                    raise
                is_pub_key_stored = False

            if not is_pub_key_stored:
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
        # reload=is_dev,
    )
