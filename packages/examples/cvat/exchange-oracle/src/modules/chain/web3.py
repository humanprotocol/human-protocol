from web3 import Web3
from web3.providers.rpc import HTTPProvider
from src.constants import Networks
from src.config import Config


def get_web3(network_id: Networks):
    if network_id == Config.polygon_mainnet.network_id:
        return Web3(HTTPProvider(Config.polygon_mainnet.rpc_api))
    else:
        return Web3(HTTPProvider(Config.polygon_mumbai.rpc_api))
