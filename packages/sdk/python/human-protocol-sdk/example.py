import datetime
import json

from human_protocol_sdk.constants import ChainId, Status
from human_protocol_sdk.escrow import EscrowUtils
from human_protocol_sdk.filter import EscrowFilter, StatisticsFilter
from human_protocol_sdk.statistics import (
    StatisticsClient,
    HMTHoldersParam,
)
from human_protocol_sdk.operator import OperatorUtils, LeaderFilter
from human_protocol_sdk.agreement import agreement


def get_escrow_statistics(statistics_client: StatisticsClient):
    print(statistics_client.get_escrow_statistics())
    print(
        statistics_client.get_escrow_statistics(
            StatisticsFilter(
                date_from=datetime.datetime(2023, 5, 8),
                date_to=datetime.datetime(2023, 6, 8),
            )
        )
    )


def get_worker_statistics(statistics_client: StatisticsClient):
    print(statistics_client.get_worker_statistics())
    print(
        statistics_client.get_worker_statistics(
            StatisticsFilter(
                date_from=datetime.datetime(2023, 5, 8),
                date_to=datetime.datetime(2023, 6, 8),
            )
        )
    )


def get_payment_statistics(statistics_client: StatisticsClient):
    print(statistics_client.get_payment_statistics())
    print(
        statistics_client.get_payment_statistics(
            StatisticsFilter(
                date_from=datetime.datetime(2023, 5, 8),
                date_to=datetime.datetime(2023, 6, 8),
            )
        )
    )


def get_hmt_statistics(statistics_client: StatisticsClient):
    print(statistics_client.get_hmt_statistics())


def get_hmt_holders(statistics_client: StatisticsClient):
    print(
        statistics_client.get_hmt_holders(
            HMTHoldersParam(
                order_direction="desc",
            )
        )
    )
    print(
        statistics_client.get_hmt_holders(
            HMTHoldersParam(
                order_direction="asc",
            )
        )
    )
    print(
        statistics_client.get_hmt_holders(
            HMTHoldersParam(address="0xf183b3b34e70dd17859455389a3ab54d49d41e6f")
        )
    )


def get_hmt_daily_data(statistics_client: StatisticsClient):
    print(
        statistics_client.get_hmt_daily_data(
            StatisticsFilter(
                date_from=datetime.datetime(2024, 5, 8),
                date_to=datetime.datetime(2024, 6, 8),
            )
        )
    )


def get_escrows():
    print(
        EscrowUtils.get_escrows(
            EscrowFilter(
                chain_id=ChainId.POLYGON_AMOY,
                status=Status.Pending,
                date_from=datetime.datetime(2023, 5, 8),
                date_to=datetime.datetime(2023, 6, 8),
            )
        )
    )

    print(
        (
            EscrowUtils.get_escrow(
                ChainId.POLYGON_AMOY, "0xf9ec66feeafb850d85b88142a7305f55e0532959"
            )
        )
    )


def get_leaders():
    leaders = OperatorUtils.get_leaders(LeaderFilter(chain_id=ChainId.POLYGON_AMOY))
    print(leaders)
    print(OperatorUtils.get_leader(ChainId.POLYGON_AMOY, leaders[0].address))
    print(
        OperatorUtils.get_leaders(
            LeaderFilter(chain_id=ChainId.POLYGON_AMOY, role="Job Launcher")
        )
    )


def agreement_example():
    annotations = [
        ["cat", "not", "cat"],
        ["cat", "cat", "cat"],
        ["not", "not", "not"],
        ["cat", "nan", "not"],
    ]

    agreement_report = agreement(annotations, measure="fleiss_kappa")
    print(agreement_report)


if __name__ == "__main__":
    statistics_client = StatisticsClient()

    # Run single example while testing, and remove comments before commit

    get_escrows()
    get_leaders()

    statistics_client = StatisticsClient(ChainId.POLYGON_AMOY)
    get_hmt_holders(statistics_client)
    get_escrow_statistics(statistics_client)
    get_hmt_statistics(statistics_client)
    get_payment_statistics(statistics_client)
    get_worker_statistics(statistics_client)
    get_hmt_daily_data(statistics_client)

    agreement_example()
