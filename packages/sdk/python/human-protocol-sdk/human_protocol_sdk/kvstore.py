#!/usr/bin/env python3

import logging
import os
from decimal import Decimal
from typing import List, Optional

from human_protocol_sdk.constants import NETWORKS, ChainId
from human_protocol_sdk.utils import get_kvstore_interface
from web3 import Web3
from web3.middleware import construct_sign_and_send_raw_middleware, geth_poa_middleware
from web3.providers.rpc import HTTPProvider

GAS_LIMIT = int(os.getenv("GAS_LIMIT", 4712388))

LOG = logging.getLogger("human_protocol_sdk.kvstore")


class KVStoreClientError(Exception):
    """
    Raises when some error happens when interacting with kvstore.
    """

    pass


class KVStoreClient:
    """
    A class used to manage kvstore on the HUMAN network.
    """

    def __init__(self, web3: Web3, priv_key: str):
        """
        Initializes a KVStore instance.

        Args:
            web3 (Web3): The Web3 object
            priv_key (str): The private key of the account used to pay for gas
        """

        # Initialize web3 instance
        self.w3 = web3
        self.w3.middleware_onion.inject(geth_poa_middleware, layer=0)

        # Set default gas payer
        self.gas_payer = self.w3.eth.account.from_key(priv_key)
        self.w3.middleware_onion.add(
            construct_sign_and_send_raw_middleware(self.gas_payer)
        )
        self.w3.eth.default_account = self.gas_payer.address

        # Load network configuration based on chainId
        try:
            self.network = NETWORKS[ChainId(self.w3.eth.chain_id)]
        except:
            raise KVStoreClientError("Invalid ChainId")

        # Initialize contract instances
        kvstore_interface = get_kvstore_interface()
        self.kvstore_contract = self.w3.eth.contract(
            address=self.network["kvstore_address"], abi=kvstore_interface["abi"]
        )

    def set(self, key: str, value: str):
        """
        Sets the value of a key-value pair in the contract.

        Args:
            key (str): The key of the key-value pair to set
            value (str): The value of the key-value pair to set

        Returns:
            None
        """

        if not key:
            raise KVStoreClientError("Key can not be empty")
        if not value:
            raise KVStoreClientError("Value can not be empty")

        self._handle_transaction(
            "Set",
            self.kvstore_contract.functions.set(key, value),
        )

    def set_bulk(self, keys: List[str], values: List[str]):
        """
        Sets multiple key-value pairs in the contract.

        Args:
            keys (List[str]): A list of keys to set
            values (List[str]): A list of values to set

        Returns:
            None
        """

        if "" in keys:
            raise KVStoreClientError("Key can not be empty")
        if "" in values:
            raise KVStoreClientError("Value can not be empty")

        self._handle_transaction(
            "Set Bulk",
            self.kvstore_contract.functions.setBulk(keys, values),
        )

    def get(self, address: str, key: str):
        """Gets the value of a key-value pair in the contract.

        Args:
            address (str): The Ethereum address associated with the key-value pair
            key (str): The key of the key-value pair to get

        Returns:
            The value of the key-value pair if it exists
        """

        if not key:
            raise KVStoreClientError("Key can not be empty")
        if not Web3.isAddress(address):
            raise KVStoreClientError("Invalid address")
        result = self.kvstore_contract.functions.get(address, key).call()
        if not result:
            raise KVStoreClientError("Value not found")
        return result

    def _handle_transaction(self, tx_name, tx):
        try:
            tx_hash = tx.transact()
            self.w3.eth.waitForTransactionReceipt(tx_hash)
        except Exception as e:
            LOG.exception(f"{tx_name} failed due to {e}.")
            raise KVStoreClientError("Transaction failed.")
