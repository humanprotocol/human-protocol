import datetime
import json
from unittest.mock import MagicMock

from human_protocol_sdk.constants import ChainId, Status
from human_protocol_sdk.escrow import EscrowUtils
from human_protocol_sdk.filter import EscrowFilter, StatisticsFilter
from human_protocol_sdk.statistics import (
    StatisticsClient,
    HMTHoldersParam,
)
from human_protocol_sdk.operator import OperatorUtils, LeaderFilter
from human_protocol_sdk.agreement import agreement
from human_protocol_sdk.transaction import TransactionUtils, TransactionFilter


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


def create_bulk_payout_transaction_example():
    from web3 import Web3
    from eth_typing import URI
    from human_protocol_sdk.escrow import EscrowClient
    from web3.middleware import construct_sign_and_send_raw_middleware

    rpc_url = "https://polygon-amoy.g.alchemy.com/v2/LAmhWAjFXhdNfnXo5wsh890nJEgE9DZu"
    private_key = "0fa18d48fe17c5339faea61064b9d1b3fd17f7cf5a6b40cd249e3ce08c9705cb"

    def get_w3_with_priv_key(priv_key: str):
        w3 = Web3(Web3.HTTPProvider(URI(rpc_url)))
        gas_payer = w3.eth.account.from_key(priv_key)
        w3.eth.default_account = gas_payer.address
        w3.middleware_onion.add(
            construct_sign_and_send_raw_middleware(gas_payer),
            "construct_sign_and_send_raw_middleware",
        )
        return (w3, gas_payer)

    (w3, gas_payer) = get_w3_with_priv_key(private_key)
    escrow_client = EscrowClient(w3)

    # Parámetros de la transacción
    escrow_address = (
        "0x5235EEb56471cB0A395776988b213C2832b22d62"  # Dirección del escrow
    )
    # Direcciones de los destinatarios
    recipients = ["0x4163766Cde8410fDDabC4C75a0E2939c55116cC7"]
    amounts = [100]  # Cantidades para cada destinatario
    final_results_url = "https://www.example.com/result"  # URL de resultados finales
    final_results_hash = "test"  # Hash de los resultados finales
    txId = 1  # ID de la transacción

    # Enviar la transacción
    try:
        transaction = escrow_client.create_bulk_payout_transaction(
            escrow_address,
            recipients,
            amounts,
            final_results_url,
            final_results_hash,
            txId,
        )
        signed_transaction = w3.eth.account.sign_transaction(transaction, private_key)
        tx_hash = w3.eth.send_raw_transaction(signed_transaction.raw_transaction)

        # Esperar a que se mine la transacción
        tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        print(f"Transaction sent with hash: {tx_hash.hex()}")
        print(f"Transaction receipt: {tx_receipt}")
        print(f"Transaction receipt: {tx_receipt['transactionHash'].hex()}")

    except Exception as e:
        print("Error creating bulk payout transaction:", str(e))


if __name__ == "__main__":
    statistics_client = StatisticsClient()

    # Run single example while testing, and remove comments before commit

    # get_escrows()
    # get_leaders()

    # statistics_client = StatisticsClient(ChainId.POLYGON_AMOY)
    # get_hmt_holders(statistics_client)
    # get_escrow_statistics(statistics_client)
    # get_hmt_statistics(statistics_client)
    # get_payment_statistics(statistics_client)
    # get_worker_statistics(statistics_client)
    # get_hmt_daily_data(statistics_client)

    # agreement_example()
    create_bulk_payout_transaction_example()
