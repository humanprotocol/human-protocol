"""
This client enables performing actions on the KVStore contract and
obtaining information from both the contracts and subgraph.

Internally, the SDK will use one network or another according to the network ID of the web3.
To use this client, you need to create a Web3 instance and configure the default account,
as well as some middlewares.

Code Example
------------

* With Signer

.. code-block:: python

    from eth_typing import URI
    from web3 import Web3
    from web3.middleware import SignAndSendRawMiddlewareBuilder
    from web3.providers.auto import load_provider_from_uri

    from human_protocol_sdk.kvstore import KVStoreClient

    def get_w3_with_priv_key(priv_key: str):
        w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
        gas_payer = w3.eth.account.from_key(priv_key)
        w3.eth.default_account = gas_payer.address
        w3.middleware_onion.inject(
            SignAndSendRawMiddlewareBuilder.build(priv_key),
            'SignAndSendRawMiddlewareBuilder',
            layer=0,
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

from human_protocol_sdk.constants import NETWORKS, ChainId
from human_protocol_sdk.decorators import requires_signer
from human_protocol_sdk.utils import (
    get_kvstore_interface,
    handle_error,
    validate_url,
)
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware
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
        :param gas_limit: (Optional) Gas limit for transactions
        """

        # Initialize web3 instance
        self.w3 = web3
        if not self.w3.middleware_onion.get("ExtraDataToPOA"):
            self.w3.middleware_onion.inject(
                ExtraDataToPOAMiddleware, "ExtraDataToPOA", layer=0
            )

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

    @requires_signer
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
                from web3.middleware import SignAndSendRawMiddlewareBuilder
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.kvstore import KVStoreClient

                def get_w3_with_priv_key(priv_key: str):
                    w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
                    gas_payer = w3.eth.account.from_key(priv_key)
                    w3.eth.default_account = gas_payer.address
                    w3.middleware_onion.inject(
                        SignAndSendRawMiddlewareBuilder.build(priv_key),
                        'SignAndSendRawMiddlewareBuilder',
                        layer=0,
                    )
                    return (w3, gas_payer)

                (w3, gas_payer) = get_w3_with_priv_key('YOUR_PRIVATE_KEY')
                kvstore_client = KVStoreClient(w3)
                kvstore_client.set('Role', 'RecordingOracle')
        """

        if not key:
            raise KVStoreClientError("Key cannot be empty")

        try:
            tx_hash = self.kvstore_contract.functions.set(key, value).transact(
                tx_options or {}
            )
            self.w3.eth.wait_for_transaction_receipt(tx_hash)
        except Exception as e:
            handle_error(e, KVStoreClientError)

    @requires_signer
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
                from web3.middleware import SignAndSendRawMiddlewareBuilder
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.kvstore import KVStoreClient

                def get_w3_with_priv_key(priv_key: str):
                    w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
                    gas_payer = w3.eth.account.from_key(priv_key)
                    w3.eth.default_account = gas_payer.address
                    w3.middleware_onion.inject(
                        SignAndSendRawMiddlewareBuilder.build(priv_key),
                        'SignAndSendRawMiddlewareBuilder',
                        layer=0,
                    )
                    return (w3, gas_payer)

                (w3, gas_payer) = get_w3_with_priv_key('YOUR_PRIVATE_KEY')
                kvstore_client = KVStoreClient(w3)

                keys = ['Role', 'Webhook_url']
                values = ['RecordingOracle', 'http://localhost']
                kvstore_client.set_bulk(keys, values)
        """

        if "" in keys:
            raise KVStoreClientError("Key cannot be empty")
        if len(keys) == 0:
            raise KVStoreClientError("Arrays must have any value")
        if len(keys) != len(values):
            raise KVStoreClientError("Arrays must have the same length")

        try:
            tx_hash = self.kvstore_contract.functions.setBulk(keys, values).transact(
                tx_options or {}
            )
            self.w3.eth.wait_for_transaction_receipt(tx_hash)
        except Exception as e:
            handle_error(e, KVStoreClientError)

    @requires_signer
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
                from web3.middleware import SignAndSendRawMiddlewareBuilder
                from web3.providers.auto import load_provider_from_uri

                from human_protocol_sdk.kvstore import KVStoreClient

                def get_w3_with_priv_key(priv_key: str):
                    w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
                    gas_payer = w3.eth.account.from_key(priv_key)
                    w3.eth.default_account = gas_payer.address
                    w3.middleware_onion.inject(
                        SignAndSendRawMiddlewareBuilder.build(priv_key),
                        'SignAndSendRawMiddlewareBuilder',
                        layer=0,
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
        try:
            tx_hash = self.kvstore_contract.functions.setBulk(
                [key, key + "_hash"], [url, content_hash]
            ).transact(tx_options or {})
            self.w3.eth.wait_for_transaction_receipt(tx_hash)
        except Exception as e:
            handle_error(e, KVStoreClientError)
