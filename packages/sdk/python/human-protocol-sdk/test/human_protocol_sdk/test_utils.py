import unittest
from unittest.mock import MagicMock, patch
import human_protocol_sdk.utils as utils
from human_protocol_sdk.eth_bridge import (
    get_hmtoken,
    handle_transaction,
)

from test.human_protocol_sdk.utils import (
    create_job,
    DEFAULT_GAS_PAYER,
    DEFAULT_GAS_PAYER_PRIV,
)


@patch("human_protocol_sdk.storage._connect_s3", MagicMock(), create=True)
class UtilsTestCase(unittest.TestCase):
    def setUp(self):
        self.credentials = {
            "gas_payer": DEFAULT_GAS_PAYER,
            "gas_payer_priv": DEFAULT_GAS_PAYER_PRIV,
        }
        self.rep_oracle_pub_key = b"8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5"
        self.job = create_job()

    def test_parse_transfer_transaction_with_event_and_balance(self):
        """Test we return positive results for transaction with event and balance"""
        self.job.launch(self.rep_oracle_pub_key)
        gas = 4712388
        hmt_amount = int(self.job.amount * 10**18)
        hmtoken_contract = get_hmtoken()
        txn_func = hmtoken_contract.functions.transfer
        func_args = [self.job.job_contract.address, hmt_amount]
        txn_info = {
            "gas_payer": self.job.gas_payer,
            "gas_payer_priv": self.job.gas_payer_priv,
            "gas": gas,
        }
        txn_receipt = handle_transaction(txn_func, *func_args, **txn_info)

        hmt_transferred, tx_balance = utils.parse_transfer_transaction(
            hmtoken_contract, txn_receipt
        )

        self.assertTrue(hmt_transferred)
        self.assertEqual(tx_balance, hmt_amount)

    def test_parse_transfer_transaction_without_event(self):
        """Test we return negative results for transaction with empty event"""
        hmtoken_contract = MagicMock()
        tx_receipt = MagicMock()

        hmtoken_contract.events = hmtoken_contract
        hmtoken_contract.Transfer.return_value = hmtoken_contract
        hmtoken_contract.processReceipt.side_effect = [()]

        hmt_transferred, tx_balance = utils.parse_transfer_transaction(
            hmtoken_contract, tx_receipt
        )

        self.assertFalse(hmt_transferred)
        self.assertIsNone(tx_balance)

    def test_parse_transfer_broken_transaction(self):
        """Test we return negative results for transaction not empty without balance"""
        hmtoken_contract = MagicMock()
        tx_receipt = MagicMock()

        hmtoken_contract.events = hmtoken_contract
        hmtoken_contract.Transfer.return_value = hmtoken_contract
        hmtoken_contract.processReceipt.side_effect = [({"args": {}},)]

        hmt_transferred, tx_balance = utils.parse_transfer_transaction(
            hmtoken_contract, tx_receipt
        )

        self.assertFalse(hmt_transferred)
        self.assertIsNone(tx_balance)
