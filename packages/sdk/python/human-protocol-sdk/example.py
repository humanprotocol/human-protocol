import datetime
import json

from human_protocol_sdk.constants import ChainId
from human_protocol_sdk.escrow import EscrowUtils, Status
from human_protocol_sdk.filter import EscrowFilter
from human_protocol_sdk.staking import StakingUtils, LeaderFilter
from human_protocol_sdk.statistics import StatisticsClient, StatisticsParam
from human_protocol_sdk.storage import StorageClient
from human_protocol_sdk.agreement import agreement


def get_escrow_statistics(statistics_client: StatisticsClient):
    print(statistics_client.get_escrow_statistics())
    print(
        statistics_client.get_escrow_statistics(
            StatisticsParam(
                date_from=datetime.datetime(2023, 5, 8),
                date_to=datetime.datetime(2023, 6, 8),
            )
        )
    )


def get_worker_statistics(statistics_client: StatisticsClient):
    print(statistics_client.get_worker_statistics())
    print(
        statistics_client.get_worker_statistics(
            StatisticsParam(
                date_from=datetime.datetime(2023, 5, 8),
                date_to=datetime.datetime(2023, 6, 8),
            )
        )
    )


def get_payment_statistics(statistics_client: StatisticsClient):
    print(statistics_client.get_payment_statistics())
    print(
        statistics_client.get_payment_statistics(
            StatisticsParam(
                date_from=datetime.datetime(2023, 5, 8),
                date_to=datetime.datetime(2023, 6, 8),
            )
        )
    )


def get_hmt_statistics(statistics_client: StatisticsClient):
    print(statistics_client.get_hmt_statistics())
    print(
        statistics_client.get_hmt_statistics(
            StatisticsParam(
                date_from=datetime.datetime(2023, 5, 8),
                date_to=datetime.datetime(2023, 6, 8),
            )
        )
    )


def get_escrows():
    print(
        EscrowUtils.get_escrows(
            EscrowFilter(
                networks=[ChainId.POLYGON_AMOY],
                status=Status.Pending,
                date_from=datetime.datetime(2023, 5, 8),
                date_to=datetime.datetime(2023, 6, 8),
            )
        )
    )

    print(
        vars(
            EscrowUtils.get_escrow(
                ChainId.POLYGON_AMOY, "0xf9ec66feeafb850d85b88142a7305f55e0532959"
            )
        )
    )


def get_leaders():
    leaders = StakingUtils.get_leaders()
    print(leaders)
    print(vars(StakingUtils.get_leader(ChainId.POLYGON_AMOY, leaders[0].address)))
    print(
        StakingUtils.get_leaders(
            LeaderFilter(networks=[ChainId.POLYGON_AMOY], role="Job Launcher")
        )
    )


def agreement_example():
    # process annotation data and get quality estimates
    url = "https://raw.githubusercontent.com/humanprotocol/human-protocol/efa8d3789ac35915b42435011cd0a8d36507564c/packages/sdk/python/human-protocol-sdk/example_annotations.json"
    annotations = json.loads(StorageClient.download_file_from_url(url))
    print(annotations)

    report = agreement(
        data=annotations["data"],
        data_format=annotations["data_format"],
        labels=annotations["labels"],
        nan_values=annotations["nan_values"],
        measure="fleiss_kappa",
        bootstrap_method="bca",
        bootstrap_kwargs={"seed": 42},
    )
    print(report["results"])
    print(report["config"])


if __name__ == "__main__":
    statistics_client = StatisticsClient()

    # Run single example while testing, and remove comments before commit

    get_escrow_statistics(statistics_client)
    get_worker_statistics(statistics_client)
    get_payment_statistics(statistics_client)
    get_hmt_statistics(statistics_client)

    agreement_example()

    get_escrows()
    get_leaders()
