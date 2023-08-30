import datetime
from web3 import Web3

from human_protocol_sdk.escrow import EscrowClient, EscrowFilter, Status
from human_protocol_sdk.statistics import StatisticsClient, StatisticsParam

if __name__ == "__main__":
    alchemy_url = (
        "https://polygon-mumbai.g.alchemy.com/v2/lnog1fIT7pvL4_o3lkcosQ7PL08ed3nX"
    )
    w3 = Web3(Web3.HTTPProvider(alchemy_url))

    escrow_client = EscrowClient(w3)

    print(
        escrow_client.get_escrows(
            EscrowFilter(
                status=Status.Pending,
                date_from=datetime.datetime(2023, 5, 8),
                date_to=datetime.datetime(2023, 6, 8),
            )
        )
    )

    statistics_client = StatisticsClient(w3)

    print(statistics_client.get_escrow_statistics())
    print(
        statistics_client.get_escrow_statistics(
            StatisticsParam(
                date_from=datetime.datetime(2023, 5, 8),
                date_to=datetime.datetime(2023, 6, 8),
            )
        )
    )

    print(statistics_client.get_worker_statistics())
    print(
        statistics_client.get_worker_statistics(
            StatisticsParam(
                date_from=datetime.datetime(2023, 5, 8),
                date_to=datetime.datetime(2023, 6, 8),
            )
        )
    )

    print(statistics_client.get_payment_statistics())
    print(
        statistics_client.get_payment_statistics(
            StatisticsParam(
                date_from=datetime.datetime(2023, 5, 8),
                date_to=datetime.datetime(2023, 6, 8),
            )
        )
    )
    print(statistics_client.get_hmt_statistics())
    print(
        statistics_client.get_hmt_statistics(
            StatisticsParam(
                date_from=datetime.datetime(2023, 5, 8),
                date_to=datetime.datetime(2023, 6, 8),
            )
        )
    )
