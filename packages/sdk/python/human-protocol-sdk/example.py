import datetime
import json
from web3 import Web3

from human_protocol_sdk.escrow import EscrowFilter, EscrowUtils, Status
from human_protocol_sdk.staking import StakingClient, LeaderFilter
from human_protocol_sdk.statistics import StatisticsClient, StatisticsParam
from human_protocol_sdk.storage import StorageClient
from human_protocol_sdk.agreement import agreement

if __name__ == "__main__":
    alchemy_url = (
        "https://polygon-mumbai.g.alchemy.com/v2/lnog1fIT7pvL4_o3lkcosQ7PL08ed3nX"
    )
    w3 = Web3(Web3.HTTPProvider(alchemy_url))

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

    staking_client = StakingClient(w3)
    leaders = staking_client.get_leaders()
    print(leaders)
    print(staking_client.get_leader(leaders[0]["address"]))
    print(staking_client.get_leaders(LeaderFilter(role="Job Launcher")))
