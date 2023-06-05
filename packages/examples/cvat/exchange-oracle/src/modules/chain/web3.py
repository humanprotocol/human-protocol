from web3 import Web3
from web3.providers.rpc import HTTPProvider
from src.constants import Networks
from src.config import Config


def get_web3(network_id: Networks):
    match network_id:
        case Config.polygon_mainnet.network_id:
            return Web3(HTTPProvider(Config.polygon_mainnet.rpc_api))
        case Config.polygon_mumbai.network_id:
            return Web3(HTTPProvider(Config.polygon_mumbai.rpc_api))
        case _:
            raise ValueError(f"{network_id} is not in available list of networks.")
