"""
Utility class for escrow-related operations.

Code Example
------------

.. code-block:: python

    from human_protocol_sdk.constants import ChainId
    from human_protocol_sdk.escrow import EscrowUtils, EscorwFilter, Status

    print(
        EscrowUtils.get_escrows(
            EscrowFilter(
                networks=[ChainId.POLYGON_MUMBAI],
                status=Status.Pending,
                date_from=datetime.datetime(2023, 5, 8),
                date_to=datetime.datetime(2023, 6, 8),
            )
        )
    )

Module
------
"""

from datetime import datetime
import logging
import os
from typing import List, Optional

from web3 import Web3

from human_protocol_sdk.constants import NETWORKS, ChainId
from human_protocol_sdk.filter import EscrowFilter
from human_protocol_sdk.utils import (
    get_data_from_subgraph,
)

from human_protocol_sdk.escrow.escrow_client import EscrowClientError

GAS_LIMIT = int(os.getenv("GAS_LIMIT", 4712388))

LOG = logging.getLogger("human_protocol_sdk.escrow")


class EscrowData:
    def __init__(
        self,
        chain_id: ChainId,
        id: str,
        address: str,
        amount_paid: int,
        balance: int,
        count: int,
        factory_address: str,
        launcher: str,
        status: str,
        token: str,
        total_funded_amount: int,
        created_at: datetime,
        final_results_url: Optional[str] = None,
        intermediate_results_url: Optional[str] = None,
        manifest_hash: Optional[str] = None,
        manifest_url: Optional[str] = None,
        recording_oracle: Optional[str] = None,
        recording_oracle_fee: Optional[int] = None,
        reputation_oracle: Optional[str] = None,
        reputation_oracle_fee: Optional[int] = None,
        exchange_oracle: Optional[str] = None,
        exchange_oracle_fee: Optional[int] = None,
    ):
        """
        Initializes an EscrowData instance.

        :param chain_id: Chain identifier
        :param id: Identifier
        :param address: Address
        :param amount_paid: Amount paid
        :param balance: Balance
        :param count: Count
        :param factory_address: Factory address
        :param launcher: Launcher
        :param status: Status
        :param token: Token
        :param total_funded_amount: Total funded amount
        :param created_at: Creation date
        :param final_results_url: URL for final results.
        :param intermediate_results_url: URL for intermediate results.
        :param manifest_hash: Manifest hash.
        :param manifest_url: Manifest URL.
        :param recording_oracle: Recording Oracle address.
        :param recording_oracle_fee: Recording Oracle fee.
        :param reputation_oracle: Reputation Oracle address.
        :param reputation_oracle_fee: Reputation Oracle fee.
        :param exchange_oracle: Exchange Oracle address.
        :param exchange_oracle_fee: Exchange Oracle fee.
        """

        self.id = id
        self.address = address
        self.amount_paid = amount_paid
        self.balance = balance
        self.count = count
        self.factory_address = factory_address
        self.final_results_url = final_results_url
        self.intermediate_results_url = intermediate_results_url
        self.launcher = launcher
        self.manifest_hash = manifest_hash
        self.manifest_url = manifest_url
        self.recording_oracle = recording_oracle
        self.recording_oracle_fee = recording_oracle_fee
        self.reputation_oracle = reputation_oracle
        self.reputation_oracle_fee = reputation_oracle_fee
        self.exchange_oracle = exchange_oracle
        self.exchange_oracle_fee = exchange_oracle_fee
        self.status = status
        self.token = token
        self.total_funded_amount = total_funded_amount
        self.created_at = created_at
        self.chain_id = chain_id


class EscrowUtils:
    """
    A utility class that provides additional escrow-related functionalities.
    """

    @staticmethod
    def get_escrows(
        filter: EscrowFilter = EscrowFilter(networks=[ChainId.POLYGON_MUMBAI]),
    ) -> List[EscrowData]:
        """Get an array of escrow addresses based on the specified filter parameters.

        :param filter: Object containing all the necessary parameters to filter

        :return: List of escrows

        :example:
            .. code-block:: python

                from human_protocol_sdk.constants import ChainId
                from human_protocol_sdk.escrow import EscrowUtils, EscrowFilter, Status

                print(
                    EscrowUtils.get_escrows(
                        EscrowFilter(
                            networks=[ChainId.POLYGON_MUMBAI],
                            status=Status.Pending,
                            date_from=datetime.datetime(2023, 5, 8),
                            date_to=datetime.datetime(2023, 6, 8),
                        )
                    )
                )
        """
        from human_protocol_sdk.gql.escrow import (
            get_escrows_query,
        )

        escrows = []
        for chain_id in filter.networks:
            network = NETWORKS[chain_id]
            escrows_data = get_data_from_subgraph(
                network["subgraph_url"],
                query=get_escrows_query(filter),
                params={
                    "launcher": filter.launcher.lower() if filter.launcher else None,
                    "reputationOracle": (
                        filter.reputation_oracle.lower()
                        if filter.reputation_oracle
                        else None
                    ),
                    "recordingOracle": (
                        filter.recording_oracle.lower()
                        if filter.recording_oracle
                        else None
                    ),
                    "exchangeOracle": (
                        filter.exchange_oracle.lower()
                        if filter.exchange_oracle
                        else None
                    ),
                    "jobRequesterId": filter.job_requester_id,
                    "status": filter.status.name if filter.status else None,
                    "from": (
                        int(filter.date_from.timestamp()) if filter.date_from else None
                    ),
                    "to": int(filter.date_to.timestamp()) if filter.date_to else None,
                },
            )
            escrows_raw = escrows_data["data"]["escrows"]

            escrows.extend(
                [
                    EscrowData(
                        chain_id=chain_id,
                        id=escrow.get("id", ""),
                        address=escrow.get("address", ""),
                        amount_paid=int(escrow.get("amountPaid", 0)),
                        balance=int(escrow.get("balance", 0)),
                        count=int(escrow.get("count", 0)),
                        factory_address=escrow.get("factoryAddress", ""),
                        launcher=escrow.get("launcher", ""),
                        status=escrow.get("status", ""),
                        token=escrow.get("token", ""),
                        total_funded_amount=int(escrow.get("totalFundedAmount", 0)),
                        created_at=datetime.fromtimestamp(
                            int(escrow.get("createdAt", 0))
                        ),
                        final_results_url=escrow.get("finalResultsUrl", None),
                        intermediate_results_url=escrow.get(
                            "intermediateResultsUrl", None
                        ),
                        manifest_hash=escrow.get("manifestHash", None),
                        manifest_url=escrow.get("manifestUrl", None),
                        recording_oracle=escrow.get("recordingOracle", None),
                        recording_oracle_fee=(
                            int(escrow.get("recordingOracleFee"))
                            if escrow.get("recordingOracleFee", None)
                            else None
                        ),
                        reputation_oracle=escrow.get("reputationOracle", None),
                        reputation_oracle_fee=(
                            int(escrow.get("reputationOracleFee"))
                            if escrow.get("reputationOracleFee", None)
                            else None
                        ),
                        exchange_oracle=escrow.get("exchangeOracle", None),
                        exchange_oracle_fee=(
                            int(escrow.get("exchangeOracleFee"))
                            if escrow.get("exchangeOracleFee", None)
                            else None
                        ),
                    )
                    for escrow in escrows_raw
                ]
            )

        return escrows

    @staticmethod
    def get_escrow(
        chain_id: ChainId,
        escrow_address: str,
    ) -> Optional[EscrowData]:
        """Returns the escrow for a given address.

        :param chain_id: Network in which the escrow has been deployed
        :param escrow_address: Address of the escrow

        :return: Escrow data

        :example:
            .. code-block:: python

                from human_protocol_sdk.constants import ChainId
                from human_protocol_sdk.escrow import EscrowUtils

                print(
                    EscrowUtils.get_escrow(
                        ChainId.POLYGON_MUMBAI,
                        "0x1234567890123456789012345678901234567890"
                    )
                )
        """
        from human_protocol_sdk.gql.escrow import (
            get_escrow_query,
        )

        if chain_id.value not in set(chain_id.value for chain_id in ChainId):
            raise EscrowClientError(f"Invalid ChainId")

        if not Web3.is_address(escrow_address):
            raise EscrowClientError(f"Invalid escrow address: {escrow_address}")

        network = NETWORKS[ChainId(chain_id)]

        escrow_data = get_data_from_subgraph(
            network["subgraph_url"],
            query=get_escrow_query(),
            params={
                "escrowAddress": escrow_address.lower(),
            },
        )

        escrow = escrow_data["data"]["escrow"]

        if not escrow:
            return None

        return EscrowData(
            chain_id=chain_id,
            id=escrow.get("id", ""),
            address=escrow.get("address", ""),
            amount_paid=int(escrow.get("amountPaid", 0)),
            balance=int(escrow.get("balance", 0)),
            count=int(escrow.get("count", 0)),
            factory_address=escrow.get("factoryAddress", ""),
            launcher=escrow.get("launcher", ""),
            status=escrow.get("status", ""),
            token=escrow.get("token", ""),
            total_funded_amount=int(escrow.get("totalFundedAmount", 0)),
            created_at=datetime.fromtimestamp(int(escrow.get("createdAt", 0))),
            final_results_url=escrow.get("finalResultsUrl", None),
            intermediate_results_url=escrow.get("intermediateResultsUrl", None),
            manifest_hash=escrow.get("manifestHash", None),
            manifest_url=escrow.get("manifestUrl", None),
            recording_oracle=escrow.get("recordingOracle", None),
            recording_oracle_fee=(
                int(escrow.get("recordingOracleFee"))
                if escrow.get("recordingOracleFee", None)
                else None
            ),
            reputation_oracle=escrow.get("reputationOracle", None),
            reputation_oracle_fee=(
                int(escrow.get("reputationOracleFee"))
                if escrow.get("reputationOracleFee", None)
                else None
            ),
            exchange_oracle=escrow.get("exchangeOracle", None),
            exchange_oracle_fee=(
                int(escrow.get("exchangeOracleFee"))
                if escrow.get("exchangeOracleFee", None)
                else None
            ),
        )
