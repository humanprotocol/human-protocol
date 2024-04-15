import datetime
import json

from human_protocol_sdk.constants import ChainId
from human_protocol_sdk.escrow import EscrowUtils
from human_protocol_sdk.filter import EscrowFilter
from human_protocol_sdk.statistics import StatisticsClient, StatisticsParam
from human_protocol_sdk.storage import StorageClient
from human_protocol_sdk.agreement import agreement
from human_protocol_sdk.operator import OperatorUtils


def get_rep():
    aa = OperatorUtils.get_reputation_network_operators(
        ChainId.LOCALHOST, "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65"
    )
    print(aa[0].job_types)


if __name__ == "__main__":
    statistics_client = StatisticsClient()

    # Run single example while testing, and remove comments before commit

    get_rep()
