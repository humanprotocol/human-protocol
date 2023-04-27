import unittest

from eth_typing import URI
from web3.providers.auto import load_provider_from_uri

from human_protocol_sdk.staking import StakingClient, StakingClientError
from human_protocol_sdk.utils import get_escrow_interface

from test.human_protocol_sdk.utils import (
    DEFAULT_GAS_PAYER_PRIV,
)


class StakingTestCase(unittest.TestCase):
    def setUp(self):
        self.staking_client = StakingClient(
            load_provider_from_uri(URI("http://localhost:8545")),
            DEFAULT_GAS_PAYER_PRIV,
        )

        self.create_escrow()

    def create_escrow(self):
        # TODO: Use escrow module to create escrow
        self.staking_client.approve_stake(10)
        self.staking_client.stake(10)

        tx_hash = self.staking_client.factory_contract.functions.createEscrow(
            self.staking_client.hmtoken_contract.address,
            [self.staking_client.gas_payer.address],
        ).transact()

        tx_receipt = self.staking_client.w3.eth.waitForTransactionReceipt(tx_hash)

        events = self.staking_client.factory_contract.events.Launched().processReceipt(
            tx_receipt
        )
        self.escrow_addr = events[0].get("args", {}).get("escrow", "")

        escrow_interface = get_escrow_interface()
        self.escrow = self.staking_client.w3.eth.contract(
            address=self.escrow_addr, abi=escrow_interface["abi"]
        )

        # Fund escrow
        self.staking_client.hmtoken_contract.functions.transfer(
            self.escrow_addr, 100
        ).transact()

    def cancel_escrow(self):
        # TODO: Use escrow module to cancel escrow
        self.escrow.functions.cancel().transact()

    def get_hmtoken_balance(self):
        return self.staking_client.hmtoken_contract.functions.balanceOf(
            self.staking_client.gas_payer.address
        ).call()

    def mine_blocks(self, blocks: int):
        for _ in range(blocks):
            latest_block = self.staking_client.w3.eth.get_block("latest")
            self.staking_client.w3.testing.mine(latest_block["timestamp"] + 1)

    def test_approve_stake(self):
        self.assertIsNone(self.staking_client.approve_stake(100))

    def test_approve_stake_invalid_amount(self):
        with self.assertRaises(StakingClientError):
            self.staking_client.approve_stake(-1)

    def test_stake(self):
        # HMToken balance before staking
        balance_before = self.get_hmtoken_balance()

        # Stake 100 HMT
        self.staking_client.approve_stake(100)
        self.staking_client.stake(100)

        # HMToken balance after staking
        balance_after = self.get_hmtoken_balance()

        self.assertEqual(balance_before - 100, balance_after)

    def test_stake_invalid_amount(self):
        # HMToken balance before staking
        balance_before = self.get_hmtoken_balance()

        # Stake -1 HMT
        with self.assertRaises(StakingClientError):
            self.staking_client.stake(-1)

        # HMToken balance after staking
        balance_after = self.get_hmtoken_balance()

        self.assertEqual(balance_before, balance_after)

        # Stake 1000 HMT (more than approval)
        with self.assertRaises(StakingClientError):
            self.staking_client.stake(1000)

        # HMToken balance after staking
        balance_after = self.get_hmtoken_balance()

        self.assertEqual(balance_before, balance_after)

    def test_stake_insufficient_balance(self):
        # HMToken balance before staking
        balance_before = self.get_hmtoken_balance()

        # Stake more than balance
        with self.assertRaises(StakingClientError):
            self.staking_client.stake(balance_before + 100)

        # HMToken balance after staking
        balance_after = self.get_hmtoken_balance()

        self.assertEqual(balance_before, balance_after)

    def test_allocate(self):
        # Staker info before allocation
        staker_info_before = self.staking_client.get_staker_info()

        # Allocate 10 HMT
        self.staking_client.allocate(self.escrow_addr, 10)

        # Staker info after allocation
        staker_info_after = self.staking_client.get_staker_info()
        allocation_info_after = self.staking_client.get_allocation(self.escrow_addr)

        self.assertEqual(
            staker_info_after["tokens_allocated"],
            staker_info_before["tokens_allocated"] + 10,
        )
        self.assertEqual(allocation_info_after["tokens"], 10)
        self.assertIsNotNone(allocation_info_after["created_at"])

    def test_allocate_invalid_amount(self):
        # Staker info before allocation
        staker_info_before = self.staking_client.get_staker_info()

        # Allocate -1 HMT
        with self.assertRaises(StakingClientError):
            self.staking_client.allocate(self.escrow_addr, -1)

        staker_info_after = self.staking_client.get_staker_info()
        self.assertEqual(
            staker_info_after["tokens_allocated"],
            staker_info_before["tokens_allocated"],
        )

        # Allocate more than staked
        with self.assertRaises(StakingClientError):
            self.staking_client.allocate(
                self.escrow_addr, staker_info_before["tokens_staked"] + 100
            )

        staker_info_after = self.staking_client.get_staker_info()
        self.assertEqual(
            staker_info_after["tokens_allocated"],
            staker_info_before["tokens_allocated"],
        )

    def test_allocate_invalid_escrow(self):
        with self.assertRaises(StakingClientError):
            self.staking_client.allocate(
                "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9", 10
            )  # This is Escrow Factory Implementation Address

    def test_close_allocation(self):
        self.staking_client.allocate(self.escrow_addr, 10)

        allocation_info_before = self.staking_client.get_allocation(self.escrow_addr)
        staker_info_before = self.staking_client.get_staker_info()

        self.cancel_escrow()
        self.staking_client.close_allocation(self.escrow_addr)

        allocation_info_after = self.staking_client.get_allocation(self.escrow_addr)
        staker_info_after = self.staking_client.get_staker_info()

        self.assertEqual(
            staker_info_after["tokens_allocated"],
            staker_info_before["tokens_allocated"] - allocation_info_before["tokens"],
        )
        self.assertEqual(allocation_info_after["tokens"], 0)
        self.assertIsNotNone(allocation_info_after["closed_at"])

    def test_close_allocation_invalid_escrow(self):
        with self.assertRaises(StakingClientError):
            self.staking_client.close_allocation(
                "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
            )

    def test_close_allocation_invalid_status(self):
        self.staking_client.allocate(self.escrow_addr, 10)

        with self.assertRaises(StakingClientError):
            # Escrow is not cancelled/completed
            self.staking_client.close_allocation(self.escrow_addr)

    def test_unstake(self):
        # Staker info before unstaking
        staker_info_before = self.staking_client.get_staker_info()

        # Unstake 50 HMT
        self.staking_client.unstake(50)

        # Staker info after unstaking
        staker_info_after = self.staking_client.get_staker_info()

        self.assertEqual(
            staker_info_after["tokens_staked"], staker_info_before["tokens_staked"]
        )
        self.assertEqual(
            staker_info_after["tokens_locked"], staker_info_before["tokens_locked"] + 50
        )
        self.assertIsNotNone(staker_info_after["tokens_locked_until"])

    def test_unstake_invalid_amount(self):
        # Staker info before unstaking
        staker_info_before = self.staking_client.get_staker_info()

        # Unstake -1 HMT
        with self.assertRaises(StakingClientError):
            self.staking_client.unstake(-1)

        # Staker info after unstaking
        staker_info_after = self.staking_client.get_staker_info()
        self.assertEqual(
            staker_info_after["tokens_staked"], staker_info_before["tokens_staked"]
        )
        self.assertEqual(
            staker_info_after["tokens_locked"], staker_info_before["tokens_locked"]
        )

        # Unstake more than available
        with self.assertRaises(StakingClientError):
            self.staking_client.unstake(
                staker_info_before["tokens_staked"]
                - staker_info_before["tokens_locked"]
                + 100
            )

        # Staker info after unstaking
        staker_info_after = self.staking_client.get_staker_info()
        self.assertEqual(
            staker_info_after["tokens_staked"], staker_info_before["tokens_staked"]
        )
        self.assertEqual(
            staker_info_after["tokens_locked"], staker_info_before["tokens_locked"]
        )

    def test_withdraw(self):
        # Staker info before withdrawal
        balance_before = self.get_hmtoken_balance()

        staker_info_before = self.staking_client.get_staker_info()

        # Mine 10 blocks
        self.mine_blocks(10)

        # Withdraws
        self.staking_client.withdraw()

        # Staker info after withdrawal
        balance_after = self.get_hmtoken_balance()

        self.assertEqual(
            balance_after, balance_before + staker_info_before["tokens_locked"]
        )

    def test_withdraw_invalid(self):
        # Staker info before withdrawal
        balance_before = self.get_hmtoken_balance()

        # Unstakes 5 HMT
        self.staking_client.unstake(5)

        # Withdraws immediately
        with self.assertRaises(StakingClientError):
            self.staking_client.withdraw()

        # Staker info after withdrawal
        balance_after = self.get_hmtoken_balance()

        self.assertEqual(balance_after, balance_before)


if __name__ == "__main__":
    unittest.main(exit=True)
