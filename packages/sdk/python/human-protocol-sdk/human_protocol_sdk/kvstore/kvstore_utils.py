"""Utility helpers for KVStore queries.

Example:
    ```python
    from human_protocol_sdk.constants import ChainId
    from human_protocol_sdk.kvstore import KVStoreUtils

    print(
        KVStoreUtils.get_kvstore_data(
            ChainId.POLYGON_AMOY,
            "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65",
        )
    )
    ```
"""

from datetime import datetime
import logging
import os
from typing import List, Optional, Dict

from web3 import Web3
import requests

from human_protocol_sdk.constants import NETWORKS, ChainId, KVStoreKeys
from human_protocol_sdk.utils import SubgraphOptions, custom_gql_fetch

from human_protocol_sdk.kvstore.kvstore_client import KVStoreClientError

LOG = logging.getLogger("human_protocol_sdk.kvstore")


class KVStoreData:
    """Represents a key-value pair from the KVStore.

    Attributes:
        key (str): The key of the key-value pair.
        value (str): The value associated with the key.
    """

    def __init__(self, key: str, value: str):
        self.key = key
        self.value = value


class KVStoreUtils:
    """Utility class providing KVStore-related query and data retrieval functions.

    This class offers static methods to fetch KVStore data from the HUMAN Protocol
    subgraph, including individual key-value pairs, bulk data, and specialized
    methods for URLs with hash verification and public keys.
    """

    @staticmethod
    def get_kvstore_data(
        chain_id: ChainId,
        address: str,
        options: Optional[SubgraphOptions] = None,
    ) -> Optional[List[KVStoreData]]:
        """Retrieve all KVStore data for a given address.

        Queries the subgraph for all key-value pairs associated with a specific address.

        Args:
            chain_id (ChainId): Network where the KVStore data has been stored.
            address (str): Address whose KVStore data to retrieve.
            options (Optional[SubgraphOptions]): Optional configuration for subgraph requests
                such as custom endpoints or timeout settings.

        Returns:
            List of KVStore data entries if found, empty list otherwise.

        Raises:
            KVStoreClientError: If the chain ID is invalid or the address is malformed.

        Example:
            ```python
            from human_protocol_sdk.constants import ChainId
            from human_protocol_sdk.kvstore import KVStoreUtils

            data = KVStoreUtils.get_kvstore_data(
                ChainId.POLYGON_AMOY,
                "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65",
            )
            for item in data:
                print(f"{item.key}: {item.value}")
            ```
        """
        from human_protocol_sdk.gql.kvstore import get_kvstore_by_address_query

        if chain_id.value not in set(chain_id.value for chain_id in ChainId):
            raise KVStoreClientError(f"Invalid ChainId")

        if not Web3.is_address(address):
            raise KVStoreClientError(f"Invalid KVStore address: {address}")

        network = NETWORKS[ChainId(chain_id)]

        kvstore_data = custom_gql_fetch(
            network,
            query=get_kvstore_by_address_query(),
            params={
                "address": address.lower(),
            },
            options=options,
        )

        if (
            not kvstore_data
            or "data" not in kvstore_data
            or "kvstores" not in kvstore_data["data"]
        ):
            return []

        kvstores = kvstore_data["data"]["kvstores"]

        return [
            KVStoreData(key=kvstore.get("key", ""), value=kvstore.get("value", ""))
            for kvstore in kvstores
        ]

    @staticmethod
    def get(
        chain_id: ChainId,
        address: str,
        key: str,
        options: Optional[SubgraphOptions] = None,
    ) -> str:
        """Get the value of a specific key for an address.

        Queries the subgraph for a specific key-value pair associated with an address.

        Args:
            chain_id (ChainId): Network where the KVStore data has been stored.
            address (str): Ethereum address associated with the key-value pair.
            key (str): Key to retrieve (cannot be empty).
            options (Optional[SubgraphOptions]): Optional configuration for subgraph requests.

        Returns:
            Value for the key if it exists.

        Raises:
            KVStoreClientError: If the key is empty, address is invalid, chain ID is invalid,
                or the key is not found for the address.

        Example:
            ```python
            from human_protocol_sdk.constants import ChainId
            from human_protocol_sdk.kvstore import KVStoreUtils

            role = KVStoreUtils.get(
                ChainId.POLYGON_AMOY,
                "0x62dD51230A30401C455c8398d06F85e4EaB6309f",
                "role",
            )
            print(role)
            ```
        """
        from human_protocol_sdk.gql.kvstore import get_kvstore_by_address_and_key_query

        if not key:
            raise KVStoreClientError("Key cannot be empty")
        if not Web3.is_address(address):
            raise KVStoreClientError(f"Invalid address: {address}")

        network = NETWORKS[ChainId(chain_id)]

        kvstore_data = custom_gql_fetch(
            network,
            query=get_kvstore_by_address_and_key_query(),
            params={
                "address": address.lower(),
                "key": key,
            },
            options=options,
        )

        if (
            not kvstore_data
            or "data" not in kvstore_data
            or "kvstores" not in kvstore_data["data"]
            or len(kvstore_data["data"]["kvstores"]) == 0
        ):
            raise KVStoreClientError(f"Key '{key}' not found for address {address}")

        return kvstore_data["data"]["kvstores"][0]["value"]

    @staticmethod
    def get_file_url_and_verify_hash(
        chain_id: ChainId,
        address: str,
        key: Optional[str] = "url",
        options: Optional[SubgraphOptions] = None,
    ) -> str:
        """Get a stored URL and verify its content hash.

        Retrieves a URL from KVStore, fetches its content, and verifies that the
        content hash matches the stored hash value. This ensures the file content
        has not been tampered with.

        Args:
            chain_id (ChainId): Network where the KVStore data has been stored.
            address (str): Address from which to get the URL value.
            key (Optional[str]): Configurable URL key. Defaults to ``"url"``.
                The hash key is expected to be ``"{key}_hash"``.
            options (Optional[SubgraphOptions]): Optional configuration for subgraph requests.

        Returns:
            URL value if it exists and the content hash matches.
                Returns empty string if URL is not set.

        Raises:
            KVStoreClientError: If the address is invalid, hash verification fails,
                or the URL is unreachable.

        Example:
            ```python
            from human_protocol_sdk.constants import ChainId
            from human_protocol_sdk.kvstore import KVStoreUtils

            chain_id = ChainId.POLYGON_AMOY
            address = "0x62dD51230A30401C455c8398d06F85e4EaB6309f"

            url = KVStoreUtils.get_file_url_and_verify_hash(chain_id, address)
            linkedin_url = KVStoreUtils.get_file_url_and_verify_hash(
                chain_id, address, "linkedin_url"
            )
            ```
        """

        if not Web3.is_address(address):
            raise KVStoreClientError(f"Invalid address: {address}")

        url = KVStoreUtils.get(chain_id, address, key, options=options)
        hash = KVStoreUtils.get(chain_id, address, key + "_hash", options=options)

        if len(url) == 0:
            return url

        content = requests.get(url).text
        content_hash = Web3.keccak(text=content).hex()

        formatted_hash = hash.replace("0x", "")
        formatted_content_hash = content_hash.replace("0x", "")

        if formatted_hash != formatted_content_hash:
            raise KVStoreClientError(f"Invalid hash")

        return url

    @staticmethod
    def get_public_key(chain_id: ChainId, address: str) -> str:
        """Get the public key of an entity from KVStore.

        Retrieves and validates the public key stored for a given address.
        The public key URL is fetched from the ``public_key`` key and verified
        against its hash.

        Args:
            chain_id (ChainId): Network where the KVStore data has been stored.
            address (str): Address from which to get the public key.

        Returns:
            Public key content if it exists and is valid.
                Returns empty string if no public key is set.

        Raises:
            KVStoreClientError: If the address is invalid or hash verification fails.

        Example:
            ```python
            from human_protocol_sdk.constants import ChainId
            from human_protocol_sdk.kvstore import KVStoreUtils

            public_key = KVStoreUtils.get_public_key(
                ChainId.POLYGON_AMOY,
                "0x62dD51230A30401C455c8398d06F85e4EaB6309f",
            )
            print(public_key)
            ```
        """

        public_key_url = KVStoreUtils.get_file_url_and_verify_hash(
            chain_id, address, KVStoreKeys.public_key.value
        )

        if public_key_url == "":
            return ""

        public_key = requests.get(public_key_url).text

        return public_key
