"""
Utility class for KVStore-related operations.

Code Example
------------

.. code-block:: python

    from human_protocol_sdk.constants import ChainId
    from human_protocol_sdk.kvstore import KVStoreUtils

    print(
        KVStoreUtils.get_data(
            ChainId.POLYGON_AMOY,
            "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65"
        )
    )

Module
------
"""

from datetime import datetime
import logging
import os
from typing import List, Optional, Dict

from web3 import Web3
import requests

from human_protocol_sdk.constants import NETWORKS, ChainId, KVStoreKeys
from human_protocol_sdk.utils import get_data_from_subgraph

from human_protocol_sdk.kvstore.kvstore_client import KVStoreClientError

LOG = logging.getLogger("human_protocol_sdk.kvstore")


class KVStoreData:
    def __init__(self, key: str, value: str):
        """
        Initializes a KVStoreData instance.

        :param key: Key
        :param value: Value
        """
        self.key = key
        self.value = value


class KVStoreUtils:
    """
    A utility class that provides additional KVStore-related functionalities.
    """

    @staticmethod
    def get_kvstore_data(
        chain_id: ChainId,
        address: str,
    ) -> Optional[List[KVStoreData]]:
        """Returns the KVStore data for a given address.

        :param chain_id: Network in which the KVStore data has been deployed
        :param address: Address of the KVStore

        :return: List of KVStore data

        :example:
            .. code-block:: python

                from human_protocol_sdk.constants import ChainId
                from human_protocol_sdk.kvstore import KVStoreUtils

                print(
                    KVStoreUtils.get_kvstore_data(
                        ChainId.POLYGON_AMOY,
                        "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65"
                    )
                )
        """
        from human_protocol_sdk.gql.kvstore import get_kvstore_by_address_query

        if chain_id.value not in set(chain_id.value for chain_id in ChainId):
            raise KVStoreClientError(f"Invalid ChainId")

        if not Web3.is_address(address):
            raise KVStoreClientError(f"Invalid KVStore address: {address}")

        network = NETWORKS[ChainId(chain_id)]

        kvstore_data = get_data_from_subgraph(
            network,
            query=get_kvstore_by_address_query(),
            params={
                "address": address.lower(),
            },
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
    def get(chain_id: ChainId, address: str, key: str) -> str:
        """Gets the value of a key-value pair in the contract.

        :param chain_id: Network in which the KVStore data has been deployed
        :param address: The Ethereum address associated with the key-value pair
        :param key: The key of the key-value pair to get

        :return: The value of the key-value pair if it exists

        :example:
            .. code-block:: python

                from human_protocol_sdk.constants import ChainId
                from human_protocol_sdk.kvstore import KVStoreUtils

                chain_id = ChainId.POLYGON_AMOY
                address = '0x62dD51230A30401C455c8398d06F85e4EaB6309f'
                key = 'role'

                result = KVStoreUtils.get(chain_id, address, key)
                print(result)
        """
        from human_protocol_sdk.gql.kvstore import get_kvstore_by_address_and_key_query

        if not key:
            raise KVStoreClientError("Key can not be empty")
        if not Web3.is_address(address):
            raise KVStoreClientError(f"Invalid address: {address}")

        network = NETWORKS[ChainId(chain_id)]

        kvstore_data = get_data_from_subgraph(
            network,
            query=get_kvstore_by_address_and_key_query(),
            params={
                "address": address.lower(),
                "key": key,
            },
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
        chain_id: ChainId, address: str, key: Optional[str] = "url"
    ) -> str:
        """Gets the URL value of the given entity, and verify its hash.

        :param chain_id: Network in which the KVStore data has been deployed
        :param address: Address from which to get the URL value.
        :param key: Configurable URL key. `url` by default.

        :return url: The URL value of the given address if exists, and the content is valid

        :example:
            .. code-block:: python

                from human_protocol_sdk.constants import ChainId
                from human_protocol_sdk.kvstore import KVStoreUtils

                chain_id = ChainId.POLYGON_AMOY
                address = '0x62dD51230A30401C455c8398d06F85e4EaB6309f'

                url = KVStoreUtils.get_file_url_and_verify_hash(chain_id, address)
                linkedin_url = KVStoreUtils.get_file_url_and_verify_hash(chain_id, address, 'linkedin_url')
        """

        if not Web3.is_address(address):
            raise KVStoreClientError(f"Invalid address: {address}")

        url = KVStoreUtils.get(chain_id, address, key)
        hash = KVStoreUtils.get(chain_id, address, key + "_hash")

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
        """Gets the public key of the given entity, and verify its hash.

        :param chain_id: Network in which the KVStore data has been deployed
        :param address: Address from which to get the public key.

        :return public_key: The public key of the given address if exists, and the content is valid

        :example:
            .. code-block:: python

                from human_protocol_sdk.constants import ChainId
                from human_protocol_sdk.kvstore import KVStoreUtils

                chain_id = ChainId.POLYGON_AMOY
                address = '0x62dD51230A30401C455c8398d06F85e4EaB6309f'

                public_key = KVStoreUtils.get_public_key(chain_id, address)
        """

        public_key_url = KVStoreUtils.get_file_url_and_verify_hash(
            chain_id, address, KVStoreKeys.public_key.value
        )

        if public_key_url == "":
            return ""

        public_key = requests.get(public_key_url).text

        return public_key
