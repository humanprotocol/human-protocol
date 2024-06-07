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

from human_protocol_sdk.constants import NETWORKS, ChainId
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
