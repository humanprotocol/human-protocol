import datetime
import json
from web3 import Web3

from human_protocol_sdk.escrow import EscrowUtils, Status
from human_protocol_sdk.filter import EscrowFilter
from human_protocol_sdk.staking import StakingClient, LeaderFilter
from human_protocol_sdk.statistics import StatisticsClient, StatisticsParam
from human_protocol_sdk.storage import StorageClient
from human_protocol_sdk.agreement import agreement

# Replace with your own Alchemy URL and IM API key
ALCHEMY_URL = ""
IM_API_KEY = ""


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
                status=Status.Pending,
                date_from=datetime.datetime(2023, 5, 8),
                date_to=datetime.datetime(2023, 6, 8),
                networks=[80001],
            )
        )
    )


def get_leaders(staking_client: StakingClient):
    leaders = staking_client.get_leaders()
    print(leaders)
    print(staking_client.get_leader(leaders[0]["address"]))
    print(staking_client.get_leaders(LeaderFilter(role="Job Launcher")))


def agreeement_example():
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
    alchemy_url = ALCHEMY_URL
    w3 = Web3(Web3.HTTPProvider(alchemy_url))

    statistics_client = StatisticsClient(
        w3,
        IM_API_KEY,
    )

    # Run single example while testing, and remove comments before commit

    get_escrow_statistics(statistics_client)
    get_worker_statistics(statistics_client)
    get_payment_statistics(statistics_client)
    get_hmt_statistics(statistics_client)

    agreeement_example()

    get_escrows()
    get_leaders()
