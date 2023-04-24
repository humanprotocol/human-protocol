import os
import unittest

from eth_typing import URI
from web3.providers.auto import load_provider_from_uri

from human_protocol_sdk.constants import ChainId
from human_protocol_sdk.staking import StakingClient, StakingClientError

from test.human_protocol_sdk.utils import (
    DEFAULT_GAS_PAYER_PRIV,
)


class StakingTestCase(unittest.TestCase):
    def setUp(self):
        self.staking_client = StakingClient(
            ChainId.LOCALHOST,
            load_provider_from_uri(URI("http://localhost:8545")),
            DEFAULT_GAS_PAYER_PRIV,
        )

    def test_approve_stake(self):
        tx_receipt = self.staking_client.approve_stake(100)
        self.assertIsNotNone(tx_receipt)

    def test_approve_stake_invalid_amount(self):
        with self.assertRaises(StakingClientError):
            self.staking_client.approve_stake(-1)


if __name__ == "__main__":
    unittest.main(exit=True)
