#!/usr/bin/env python3

import logging
import os
from decimal import Decimal
from typing import List, Optional

from human_protocol_sdk.constants import NETWORKS, ChainId
from human_protocol_sdk.utils import get_kvstore_interface, handle_transaction
from web3 import Web3
from web3.middleware import geth_poa_middleware

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

    def __init__(self, web3: Web3):
        """
        Initializes a KVStore instance.

        Args:
            web3 (Web3): The Web3 object
        """

        # Initialize web3 instance
        self.w3 = web3
        if not self.w3.middleware_onion.get("geth_poa"):
            self.w3.middleware_onion.inject(geth_poa_middleware, "geth_poa", layer=0)

        chain_id = None
        # Load network configuration based on chainId
        try:
            chain_id = self.w3.eth.chain_id
            self.network = NETWORKS[ChainId(chain_id)]
        except:
            if chain_id is not None:
                raise KVStoreClientError(f"Invalid ChainId: {chain_id}")
            else:
                raise KVStoreClientError(f"Invalid Web3 Instance")

        # Initialize contract instances
        kvstore_interface = get_kvstore_interface()
        self.kvstore_contract = self.w3.eth.contract(
            address=self.network["kvstore_address"], abi=kvstore_interface["abi"]
        )

    def set(self, key: str, value: str) -> None:
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

        handle_transaction(
            self.w3,
            "Set",
            self.kvstore_contract.functions.set(key, value),
            KVStoreClientError,
        )

    def set_bulk(self, keys: List[str], values: List[str]) -> None:
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
        if len(keys) == 0:
            raise KVStoreClientError("Arrays must have any value")
        if len(keys) != len(values):
            raise KVStoreClientError("Arrays must have same length")

        handle_transaction(
            self.w3,
            "Set Bulk",
            self.kvstore_contract.functions.setBulk(keys, values),
            KVStoreClientError,
        )

    def get(self, address: str, key: str) -> str:
        """Gets the value of a key-value pair in the contract.

        Args:
            address (str): The Ethereum address associated with the key-value pair
            key (str): The key of the key-value pair to get

        Returns:
            value (str): The value of the key-value pair if it exists
        """

        if not key:
            raise KVStoreClientError("Key can not be empty")
        if not Web3.is_address(address):
            raise KVStoreClientError(f"Invalid address: {address}")
        result = self.kvstore_contract.functions.get(address, key).call()
        return result
