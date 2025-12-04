"""Client for interacting with the KVStore contract and subgraph.

Selects the network based on the Web3 chain id. Configure Web3 with an account
and signer middleware for writes; read operations work without a signer.

Examples:
    With signer:
    ```python
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
            "SignAndSendRawMiddlewareBuilder",
            layer=0,
        )
        return w3

    w3 = get_w3_with_priv_key("YOUR_PRIVATE_KEY")
    kvstore_client = KVStoreClient(w3)
    ```

    Read-only:
    ```python
    from eth_typing import URI
    from web3 import Web3
    from web3.providers.auto import load_provider_from_uri
    from human_protocol_sdk.kvstore import KVStoreClient

    w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
    kvstore_client = KVStoreClient(w3)
    ```
"""

import logging
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
    """Raised when an error occurs while interacting with KVStore."""

    pass


class KVStoreClient:
    """Manage KVStore interactions on the HUMAN network."""

    def __init__(self, web3: Web3, gas_limit: Optional[int] = None):
        """Create a KVStore client.

        Args:
            web3: Web3 instance configured for the target network.
            gas_limit: Optional gas limit for transactions.
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
        """Set the value of a key-value pair in the contract.

        Args:
            key: Key to set.
            value: Value to assign.
            tx_options: Optional transaction parameters.

        Raises:
            KVStoreClientError: On invalid input or transaction failure.

        Example:
            ```python
            kvstore_client.set("Role", "RecordingOracle")
            ```
        """

        if not key:
            raise KVStoreClientError("Key cannot be empty")

        try:
            tx_hash = self.kvstore_contract.functions.set(key, value).transact(
                tx_options
            )
            self.w3.eth.wait_for_transaction_receipt(tx_hash)
        except Exception as e:
            handle_error(e, KVStoreClientError)

    @requires_signer
    def set_bulk(
        self, keys: List[str], values: List[str], tx_options: Optional[TxParams] = None
    ) -> None:
        """Set multiple key-value pairs in the contract.

        Args:
            keys: List of keys to set.
            values: Corresponding list of values.
            tx_options: Optional transaction parameters.

        Raises:
            KVStoreClientError: On invalid input or transaction failure.

        Example:
            ```python
            kvstore_client.set_bulk(
                ["Role", "Webhook_url"],
                ["RecordingOracle", "http://localhost"],
            )
            ```
        """

        if "" in keys:
            raise KVStoreClientError("Key cannot be empty")
        if len(keys) == 0:
            raise KVStoreClientError("Arrays must have any value")
        if len(keys) != len(values):
            raise KVStoreClientError("Arrays must have the same length")

        try:
            tx_hash = self.kvstore_contract.functions.setBulk(keys, values).transact(
                tx_options
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
        """Set a URL value and its hash for the sender address.

        Args:
            url: URL to set.
            key: Configurable URL key (defaults to ``url``).
            tx_options: Optional transaction parameters.

        Raises:
            KVStoreClientError: If validation or transaction fails.

        Example:
            ```python
            kvstore_client.set_file_url_and_hash("http://localhost")
            kvstore_client.set_file_url_and_hash(
                "https://linkedin.com/me", "linkedin_url"
            )
            ```
        """
        if not validate_url(url):
            raise KVStoreClientError(f"Invalid URL: {url}")

        content = requests.get(url).text
        content_hash = self.w3.keccak(text=content).hex()
        try:
            tx_hash = self.kvstore_contract.functions.setBulk(
                [key, key + "_hash"], [url, content_hash]
            ).transact(tx_options)
            self.w3.eth.wait_for_transaction_receipt(tx_hash)
        except Exception as e:
            handle_error(e, KVStoreClientError)

    def get(self, address: str, key: str) -> str:
        """Get the value of a key-value pair in the contract.

        Args:
            address: Ethereum address associated with the key-value pair.
            key: Key to retrieve.

        Returns:
            Value of the key-value pair if it exists.

        Example:
            ```python
            role = kvstore_client.get(
                "0x62dD51230A30401C455c8398d06F85e4EaB6309f",
                "Role",
            )
            ```
        """

        if not key:
            raise KVStoreClientError("Key cannot be empty")
        if not Web3.is_address(address):
            raise KVStoreClientError(f"Invalid address: {address}")
        try:
            return self.kvstore_contract.functions.get(address, key).call()
        except Exception as e:
            handle_error(e, KVStoreClientError)
