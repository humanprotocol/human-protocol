import datetime

from human_protocol_sdk.constants import ChainId, OrderDirection, Status
from human_protocol_sdk.escrow import EscrowUtils
from human_protocol_sdk.worker import WorkerUtils
from human_protocol_sdk.filter import (
    EscrowFilter,
    PayoutFilter,
    StatisticsFilter,
    WorkerFilter,
    StakersFilter,
)
from human_protocol_sdk.statistics import (
    StatisticsClient,
    HMTHoldersParam,
)
from human_protocol_sdk.operator import OperatorUtils, OperatorFilter
from human_protocol_sdk.agreement import agreement
from human_protocol_sdk.staking.staking_utils import StakingUtils


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


def get_payouts():
    filter = PayoutFilter(
        chain_id=ChainId.POLYGON,
        first=5,
        skip=1,
        order_direction=OrderDirection.ASC,
    )

    payouts = EscrowUtils.get_payouts(filter)
    for payout in payouts:
        print(
            f"Payout ID: {payout.id}, Amount: {payout.amount}, Recipient: {payout.recipient}"
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


def get_operators():
    operators = OperatorUtils.get_operators(
        OperatorFilter(chain_id=ChainId.POLYGON_AMOY)
    )
    print(operators)
    print(OperatorUtils.get_operator(ChainId.POLYGON_AMOY, operators[0].address))
    print(
        OperatorUtils.get_operators(
            OperatorFilter(chain_id=ChainId.POLYGON_AMOY, roles="Job Launcher")
        )
    )
    operators = OperatorUtils.get_operators(
        OperatorFilter(chain_id=ChainId.POLYGON_AMOY, roles=["Job Launcher"])
    )
    print(len(operators))

    operators = OperatorUtils.get_operators(
        OperatorFilter(
            chain_id=ChainId.POLYGON_AMOY,
            min_amount_staked=1,
            roles=["Job Launcher", "Reputation Oracle"],
        )
    )
    print(len(operators))


def get_workers():
    workers = WorkerUtils.get_workers(
        WorkerFilter(chain_id=ChainId.POLYGON_AMOY, first=2)
    )
    print(workers)
    print(WorkerUtils.get_worker(ChainId.POLYGON_AMOY, workers[0].address))
    workers = WorkerUtils.get_workers(
        WorkerFilter(chain_id=ChainId.POLYGON_AMOY, worker_address=workers[0].address)
    )
    print(len(workers))


def agreement_example():
    annotations = [
        ["cat", "not", "cat"],
        ["cat", "cat", "cat"],
        ["not", "not", "not"],
        ["cat", "nan", "not"],
    ]

    agreement_report = agreement(annotations, measure="fleiss_kappa")
    print(agreement_report)


def get_stakers_example():
    stakers = StakingUtils.get_stakers(
        StakersFilter(
            chain_id=ChainId.POLYGON_AMOY,
            order_by="lastDepositTimestamp",
            order_direction=OrderDirection.ASC,
        )
    )
    print("Filtered stakers:", len(stakers))

    if stakers:
        staker = StakingUtils.get_staker(ChainId.LOCALHOST, stakers[0].address)
        print("Staker info:", staker.address)
    else:
        print("No stakers found.")


if __name__ == "__main__":
    statistics_client = StatisticsClient()

    # Run single example while testing, and remove comments before commit

    get_escrows()
    get_operators()
    get_payouts()

    statistics_client = StatisticsClient(ChainId.POLYGON_AMOY)
    get_hmt_holders(statistics_client)
    get_escrow_statistics(statistics_client)
    get_hmt_statistics(statistics_client)
    get_payment_statistics(statistics_client)
    get_worker_statistics(statistics_client)
    get_hmt_daily_data(statistics_client)

    agreement_example()
    get_workers()
    get_stakers_example()
