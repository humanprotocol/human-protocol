import datetime

from human_protocol_sdk.constants import ChainId, OrderDirection, Status
from human_protocol_sdk.escrow import EscrowUtils
from human_protocol_sdk.worker import WorkerUtils
from human_protocol_sdk.filter import (
    EscrowFilter,
    PayoutFilter,
    CancellationRefundFilter,
    StatisticsFilter,
    WorkerFilter,
    StakersFilter,
    TransactionFilter,
)
from human_protocol_sdk.statistics import (
    StatisticsUtils,
    HMTHoldersParam,
)
from human_protocol_sdk.operator import OperatorUtils, OperatorFilter
from human_protocol_sdk.staking.staking_utils import StakingUtils
from human_protocol_sdk.transaction import TransactionUtils
from human_protocol_sdk.utils import SubgraphOptions


def get_escrow_statistics():
    print(StatisticsUtils.get_escrow_statistics(ChainId.POLYGON_AMOY))
    print(
        StatisticsUtils.get_escrow_statistics(
            ChainId.POLYGON_AMOY,
            StatisticsFilter(
                date_from=datetime.datetime(2023, 5, 8),
                date_to=datetime.datetime(2023, 6, 8),
            ),
        )
    )


def get_worker_statistics():
    print(StatisticsUtils.get_worker_statistics(ChainId.POLYGON_AMOY))
    print(
        StatisticsUtils.get_worker_statistics(
            ChainId.POLYGON_AMOY,
            StatisticsFilter(
                date_from=datetime.datetime(2023, 5, 8),
                date_to=datetime.datetime(2023, 6, 8),
            ),
        )
    )


def get_payment_statistics():
    print(StatisticsUtils.get_payment_statistics(ChainId.POLYGON_AMOY))
    print(
        StatisticsUtils.get_payment_statistics(
            ChainId.POLYGON_AMOY,
            StatisticsFilter(
                date_from=datetime.datetime(2023, 5, 8),
                date_to=datetime.datetime(2023, 6, 8),
            ),
        )
    )


def get_hmt_statistics():
    print(StatisticsUtils.get_hmt_statistics(ChainId.POLYGON_AMOY))


def get_hmt_holders():
    print(
        StatisticsUtils.get_hmt_holders(
            ChainId.POLYGON_AMOY,
            HMTHoldersParam(
                order_direction="desc",
            ),
        )
    )
    print(
        StatisticsUtils.get_hmt_holders(
            ChainId.POLYGON_AMOY,
            HMTHoldersParam(
                order_direction="asc",
            ),
        )
    )
    print(
        StatisticsUtils.get_hmt_holders(
            ChainId.POLYGON_AMOY,
            HMTHoldersParam(address="0xf183b3b34e70dd17859455389a3ab54d49d41e6f"),
        )
    )


def get_hmt_daily_data():
    print(
        StatisticsUtils.get_hmt_daily_data(
            ChainId.POLYGON_AMOY,
            StatisticsFilter(
                date_from=datetime.datetime(2024, 5, 8),
                date_to=datetime.datetime(2024, 6, 8),
            ),
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


def get_cancellation_refunds():
    # List recent cancellation refunds
    filter = CancellationRefundFilter(
        chain_id=ChainId.POLYGON_AMOY,
        first=5,
        skip=0,
        order_direction=OrderDirection.ASC,
    )

    refunds = EscrowUtils.get_cancellation_refunds(filter)
    for refund in refunds:
        print(
            "Refund ID:",
            refund.id,
            "Escrow:",
            refund.escrow_address,
            "Amount:",
            refund.amount,
            "Receiver:",
            refund.receiver,
            "Tx:",
            refund.tx_hash,
        )

    # Fetch a single cancellation refund by escrow address if available
    if refunds:
        single = EscrowUtils.get_cancellation_refund(
            ChainId.POLYGON_AMOY, refunds[0].escrow_address
        )
        if single:
            print(
                "Single refund:",
                single.id,
                "Escrow:",
                single.escrow_address,
                "Amount:",
                single.amount,
                "Receiver:",
                single.receiver,
                "Tx:",
                single.tx_hash,
            )
        else:
            print("No single refund found for escrow", refunds[0].escrow_address)


def get_escrows():
    print(
        EscrowUtils.get_escrows(
            EscrowFilter(
                chain_id=ChainId.POLYGON_AMOY,
                status=Status.Pending,
                date_from=datetime.datetime(2023, 5, 8),
                date_to=datetime.datetime(2023, 6, 8),
            ),
            SubgraphOptions(3, 1000),
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
    print(vars(operators[0]))
    print(OperatorUtils.get_operator(ChainId.POLYGON_AMOY, operators[0].address))
    print(
        OperatorUtils.get_operators(
            OperatorFilter(chain_id=ChainId.POLYGON_AMOY, roles="job_launcher")
        )
    )
    operators = OperatorUtils.get_operators(
        OperatorFilter(chain_id=ChainId.POLYGON_AMOY, roles=["job_launcher"])
    )
    print(len(operators))

    operators = OperatorUtils.get_operators(
        OperatorFilter(
            chain_id=ChainId.POLYGON_AMOY,
            min_staked_amount=1,
            roles=["job_launcher", "reputation_oracle"],
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


def get_stakers_example():
    stakers = StakingUtils.get_stakers(
        StakersFilter(
            chain_id=ChainId.POLYGON_AMOY,
            order_by="lastDepositTimestamp",
            order_direction=OrderDirection.ASC,
        ),
        SubgraphOptions(3, 1000),
    )
    print("Filtered stakers:", len(stakers))

    if stakers:
        staker = StakingUtils.get_staker(ChainId.POLYGON_AMOY, stakers[0].address)
        print("Staker info:", staker.address)
    else:
        print("No stakers found.")


def get_transactions_example():
    first_page = TransactionUtils.get_transactions(
        TransactionFilter(
            chain_id=ChainId.POLYGON_AMOY,
            from_address="0xF3D9a0ba9FA14273C515e519DFD0826Ff87d5164",
            start_block=6282708,
        )
    )
    print("Fetched", len(first_page), "transactions with start block")


if __name__ == "__main__":

    # Run single example while testing, and remove comments before commit

    get_escrows()
    get_operators()
    get_payouts()
    get_cancellation_refunds()
    get_hmt_holders()
    get_escrow_statistics()
    get_hmt_statistics()
    get_payment_statistics()
    get_worker_statistics()
    get_hmt_daily_data()

    get_workers()
    get_stakers_example()
    get_transactions_example()
