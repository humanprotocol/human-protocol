from web3 import Web3
from web3.providers.rpc import HTTPProvider
from src.constants import Networks
from src.config import Config


def get_web3(chain_id: Networks):
    match chain_id:
        case Config.polygon_mainnet.chain_id:
            w3 = Web3(HTTPProvider(Config.polygon_mainnet.rpc_api))
            gas_payer = w3.eth.account.from_key(Config.polygon_mainnet.private_key)
            w3.eth.default_account = gas_payer.address
            return w3
        case Config.polygon_mumbai.chain_id:
            w3 = Web3(HTTPProvider(Config.polygon_mumbai.rpc_api))
            gas_payer = w3.eth.account.from_key(Config.polygon_mumbai.private_key)
            w3.eth.default_account = gas_payer.address
            return w3
        case _:
            raise ValueError(f"{chain_id} is not in available list of networks.")
