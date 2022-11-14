import os
import unittest

from human_protocol_sdk.eth_bridge import (
    get_hmtoken,
    get_factory,
    get_escrow,
    get_pub_key_from_addr,
    handle_transaction,
    set_pub_key_at_addr,
)
from test.human_protocol_sdk.utils import (
    create_job,
    DEFAULT_GAS_PAYER,
    DEFAULT_GAS_PAYER_PRIV,
)


class EthBridgeTestCase(unittest.TestCase):
    def setUp(self):
        self.credentials = {
            "gas_payer": DEFAULT_GAS_PAYER,
            "gas_payer_priv": DEFAULT_GAS_PAYER_PRIV,
        }
        self.rep_oracle_pub_key = b"8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5"
        self.job = create_job()

    # def test_handle_transaction(self):
    #     from web3.datastructures import AttributeDict as Web3AttributeDict

    #     self.assertTrue(self.job.launch(self.rep_oracle_pub_key))
    #     gas = 4712388
    #     hmt_amount = int(self.job.amount * 10**18)
    #     hmtoken_contract = get_hmtoken()
    #     txn_func = hmtoken_contract.functions.transfer
    #     func_args = [self.job.job_contract.address, hmt_amount]
    #     txn_info = {
    #         "gas_payer": self.job.gas_payer,
    #         "gas_payer_priv": self.job.gas_payer_priv,
    #         "gas": gas,
    #     }
    #     txn_receipt = handle_transaction(txn_func, *func_args, **txn_info)
    #     self.assertIs(type(txn_receipt), Web3AttributeDict)

    # def test_get_escrow(self):
    #     self.job.launch(self.rep_oracle_pub_key)
    #     self.assertIsNotNone(get_escrow(self.job.job_contract.address))

    def test_get_factory(self):
        self.assertIsNotNone(get_factory(self.job.factory_contract.address))

    def test_set_pub_key_at_address(self):
        os.environ["GAS_PAYER"] = self.credentials["gas_payer"]
        os.environ["GAS_PAYER_PRIV"] = self.credentials["gas_payer_priv"]
        self.assertIsNotNone(
            set_pub_key_at_addr(self.rep_oracle_pub_key).transactionHash
        )


if __name__ == "__main__":
    unittest.main(exit=True)
