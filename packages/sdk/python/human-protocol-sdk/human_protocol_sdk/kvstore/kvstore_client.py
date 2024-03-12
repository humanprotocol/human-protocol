"""
This client enables to perform actions on KVStore contract and
obtain information from both the contracts and subgraph.

Internally, the SDK will use one network or another according to the network ID of the web3.
To use this client, you need to create Web3 instance, and configure default account,
as well as some middlewares.

Code Example
------------

* With Signer

.. code-block:: python

    from eth_typing import URI
    from web3 import Web3
    from web3.middleware import construct_sign_and_send_raw_middleware
    from web3.providers.auto import load_provider_from_uri

    from human_protocol_sdk.kvstore import KVStoreClient

    def get_w3_with_priv_key(priv_key: str):
        w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
        gas_payer = w3.eth.account.from_key(priv_key)
        w3.eth.default_account = gas_payer.address
        w3.middleware_onion.add(
            construct_sign_and_send_raw_middleware(gas_payer),
            "construct_sign_and_send_raw_middleware",
        )
        return (w3, gas_payer)

    (w3, gas_payer) = get_w3_with_priv_key('YOUR_PRIVATE_KEY')
    kvstore_client = KVStoreClient(w3)

* Without Signer (For read operations only)

.. code-block:: python

    from eth_typing import URI
    from web3 import Web3
    from web3.providers.auto import load_provider_from_uri

    from human_protocol_sdk.kvstore import KVStoreClient

    w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
    kvstore_client = KVStoreClient(w3)

Module
------
"""

import logging
import os
from typing import List, Optional

import requests

from human_protocol_sdk.constants import NETWORKS, ChainId, KVStoreKeys
from human_protocol_sdk.utils import (
    get_kvstore_interface,
    handle_transaction,
    validate_url,
)
from web3 import Web3
from web3.middleware import geth_poa_middleware
from web3.types import TxParams

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

    def __init__(self, web3: Web3, gas_limit: Optional[int] = None):
        """
        Initializes a KVStore instance.

        :param web3: The Web3 object
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
        self.gas_limit = gas_limit

    def set(self, key: str, value: str, tx_options: Optional[TxParams] = None) -> None:
        """
        Sets the value of a key-value pair in the contract.

        :param key: The key of the key-value pair to set
        :param value: The value of the key-value pair to set
        :param tx_options: (Optional) Additional transaction parameters

        :return: None

        :example:
            .. code-block:: python

                from eth_typing import URI
                from web3 import Web3
                from web3.middleware import construct_sign_and_send_raw_middleware
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.kvstore import KVStoreClient

                def get_w3_with_priv_key(priv_key: str):
                    w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
                    gas_payer = w3.eth.account.from_key(priv_key)
                    w3.eth.default_account = gas_payer.address
                    w3.middleware_onion.add(
                        construct_sign_and_send_raw_middleware(gas_payer),
                        "construct_sign_and_send_raw_middleware",
                    )
                    return (w3, gas_payer)

                (w3, gas_payer) = get_w3_with_priv_key('YOUR_PRIVATE_KEY')
                kvstore_client = KVStoreClient(w3)
                kvstore_client.set('Role', 'RecordingOracle')
        """

        if not key:
            raise KVStoreClientError("Key can not be empty")

        handle_transaction(
            self.w3,
            "Set",
            self.kvstore_contract.functions.set(key, value),
            KVStoreClientError,
            tx_options,
        )

    def set_bulk(
        self, keys: List[str], values: List[str], tx_options: Optional[TxParams] = None
    ) -> None:
        """
        Sets multiple key-value pairs in the contract.

        :param keys: A list of keys to set
        :param values: A list of values to set
        :param tx_options: (Optional) Additional transaction parameters

        :return: None

        :example:
            .. code-block:: python

                from eth_typing import URI
                from web3 import Web3
                from web3.middleware import construct_sign_and_send_raw_middleware
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.kvstore import KVStoreClient

                def get_w3_with_priv_key(priv_key: str):
                    w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
                    gas_payer = w3.eth.account.from_key(priv_key)
                    w3.eth.default_account = gas_payer.address
                    w3.middleware_onion.add(
                        construct_sign_and_send_raw_middleware(gas_payer),
                        "construct_sign_and_send_raw_middleware",
                    )
                    return (w3, gas_payer)

                (w3, gas_payer) = get_w3_with_priv_key('YOUR_PRIVATE_KEY')
                kvstore_client = KVStoreClient(w3)

                keys = ['Role', 'Webhook_url'];
                values = ['RecordingOracle', 'http://localhost'];
                kvstore_client.set_bulk(keys, values)
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
            tx_options,
        )

    def set_file_url_and_hash(
        self,
        url: str,
        key: Optional[str] = "url",
        tx_options: Optional[TxParams] = None,
    ) -> None:
        """
        Sets a URL value for the address that submits the transaction, and its hash.

        :param url: URL to set
        :param key: Configurable URL key. `url` by default.
        :param tx_options: (Optional) Additional transaction parameters

        :return: None

        :raise KVStoreClientError: If an error occurs while validating URL, or handling transaction

        :example:
            .. code-block:: python

                from eth_typing import URI
                from web3 import Web3
                from web3.middleware import construct_sign_and_send_raw_middleware
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.kvstore import KVStoreClient

                def get_w3_with_priv_key(priv_key: str):
                    w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
                    gas_payer = w3.eth.account.from_key(priv_key)
                    w3.eth.default_account = gas_payer.address
                    w3.middleware_onion.add(
                        construct_sign_and_send_raw_middleware(gas_payer),
                        "construct_sign_and_send_raw_middleware",
                    )
                    return (w3, gas_payer)

                (w3, gas_payer) = get_w3_with_priv_key('YOUR_PRIVATE_KEY')
                kvstore_client = KVStoreClient(w3)

                kvstore_client.set_file_url_and_hash('http://localhost')
                kvstore_client.set_file_url_and_hash('https://linkedin.com/me', 'linkedin_url')
        """
        if not validate_url(url):
            raise KVStoreClientError(f"Invalid URL: {url}")

        content = requests.get(url).text
        content_hash = self.w3.keccak(text=content).hex()

        handle_transaction(
            self.w3,
            "Set Bulk",
            self.kvstore_contract.functions.setBulk(
                [key, key + "_hash"], [url, content_hash]
            ),
            KVStoreClientError,
            tx_options,
        )

    def get(self, address: str, key: str) -> str:
        """Gets the value of a key-value pair in the contract.

        :param address: The Ethereum address associated with the key-value pair
        :param key: The key of the key-value pair to get

        :return: The value of the key-value pair if it exists

        :example:
            .. code-block:: python

                from eth_typing import URI
                from web3 import Web3
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.kvstore import KVStoreClient

                w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
                kvstore_client = KVStoreClient(w3)

                role = kvstore_client.get('0x62dD51230A30401C455c8398d06F85e4EaB6309f', 'Role')
        """

        if not key:
            raise KVStoreClientError("Key can not be empty")
        if not Web3.is_address(address):
            raise KVStoreClientError(f"Invalid address: {address}")
        result = self.kvstore_contract.functions.get(address, key).call()
        return result

    def get_file_url_and_verify_hash(
        self, address: str, key: Optional[str] = "url"
    ) -> str:
        """Gets the URL value of the given entity, and verify its hash.

        :param address: Address from which to get the URL value.
        :param key: Configurable URL key. `url` by default.

        :return url: The URL value of the given address if exists, and the content is valid

        :example:
            .. code-block:: python

                from eth_typing import URI
                from web3 import Web3
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.kvstore import KVStoreClient

                w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
                kvstore_client = KVStoreClient(w3)

                url = kvstore_client.get_file_url_and_verify_hash(
                    '0x62dD51230A30401C455c8398d06F85e4EaB6309f'
                )
                linkedin_url = kvstore_client.get_file_url_and_verify_hash(
                    '0x62dD51230A30401C455c8398d06F85e4EaB6309f',
                    'linkedin_url'
                )
        """

        if not Web3.is_address(address):
            raise KVStoreClientError(f"Invalid address: {address}")

        url = self.kvstore_contract.functions.get(address, key).call()
        hash = self.kvstore_contract.functions.get(address, key + "_hash").call()

        if len(url) == 0:
            return url

        content = requests.get(url).text
        content_hash = self.w3.keccak(text=content).hex()

        if hash != content_hash:
            raise KVStoreClientError(f"Invalid hash")

        return url

    def get_public_key(self, address: str) -> str:
        """Gets the public key of the given entity, and verify its hash.

        :param address: Address from which to get the public key.

        :return public_key: The public key of the given address if exists, and the content is valid

        :example:
            .. code-block:: python

                from eth_typing import URI
                from web3 import Web3
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.kvstore import KVStoreClient

                w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
                kvstore_client = KVStoreClient(w3)

                public_key = kvstore_client.get_public_key(
                    '0x62dD51230A30401C455c8398d06F85e4EaB6309f'
                )
        """

        public_key_url = self.get_file_url_and_verify_hash(
            address, KVStoreKeys.public_key.value
        )

        if public_key_url == "":
            return ""

        public_key = requests.get(public_key_url).text

        return public_key
