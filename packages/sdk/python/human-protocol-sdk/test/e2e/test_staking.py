import unittest

from eth_typing import URI
from web3 import Web3
from web3.middleware import construct_sign_and_send_raw_middleware
from web3.providers.auto import load_provider_from_uri

from human_protocol_sdk.staking import StakingClient, StakingClientError
from human_protocol_sdk.utils import get_escrow_interface

from test.human_protocol_sdk.utils import (
    DEFAULT_GAS_PAYER_PRIV,
)


def get_w3_with_priv_key(priv_key: str):
    w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
    gas_payer = w3.eth.account.from_key(priv_key)
    w3.eth.default_account = gas_payer.address
    w3.middleware_onion.add(
        construct_sign_and_send_raw_middleware(gas_payer),
        "construct_sign_and_send_raw_middleware",
    )
    return (w3, gas_payer)


class StakingTestCase(unittest.TestCase):
    def setUp(self):
        (self.w3, self.gas_payer) = get_w3_with_priv_key(DEFAULT_GAS_PAYER_PRIV)

        self.staking_client = StakingClient(self.w3)

        self.create_escrow()

    def create_escrow(self):
        # TODO: Use escrow module to create escrow
        self.staking_client.approve_stake(10)
        self.staking_client.stake(10)

        tx_hash = self.staking_client.factory_contract.functions.createEscrow(
            self.staking_client.hmtoken_contract.address,
            [self.gas_payer.address],
            "job-requester",
        ).transact()

        tx_receipt = self.staking_client.w3.eth.wait_for_transaction_receipt(tx_hash)

        events = (
            self.staking_client.factory_contract.events.LaunchedV2().process_receipt(
                tx_receipt
            )
        )
        self.escrow_address = events[0].get("args", {}).get("escrow", "")

        escrow_interface = get_escrow_interface()
        self.escrow = self.staking_client.w3.eth.contract(
            address=self.escrow_address, abi=escrow_interface["abi"]
        )

        # Fund escrow
        self.staking_client.hmtoken_contract.functions.transfer(
            self.escrow_address, 100
        ).transact()

    def cancel_escrow(self):
        # TODO: Use escrow module to cancel escrow
        self.escrow.functions.cancel().transact()

    def get_hmtoken_balance(self):
        return self.staking_client.hmtoken_contract.functions.balanceOf(
            self.gas_payer.address
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
        self.staking_client.allocate(self.escrow_address, 10)

        # Staker info after allocation
        staker_info_after = self.staking_client.get_staker_info()
        allocation_info_after = self.staking_client.get_allocation(self.escrow_address)

        self.assertEqual(
            staker_info_after["tokens_allocated"],
            staker_info_before["tokens_allocated"] + 10,
        )
        self.assertEqual(allocation_info_after["tokens"], 10)
        self.assertNotEqual(allocation_info_after["created_at"], 0)

    def test_allocate_invalid_amount(self):
        # Staker info before allocation
        staker_info_before = self.staking_client.get_staker_info()

        # Allocate -1 HMT
        with self.assertRaises(StakingClientError):
            self.staking_client.allocate(self.escrow_address, -1)

        staker_info_after = self.staking_client.get_staker_info()
        self.assertEqual(
            staker_info_after["tokens_allocated"],
            staker_info_before["tokens_allocated"],
        )

        # Allocate more than staked
        with self.assertRaises(StakingClientError):
            self.staking_client.allocate(
                self.escrow_address, staker_info_before["tokens_staked"] + 100
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
        self.staking_client.allocate(self.escrow_address, 10)

        allocation_info_before = self.staking_client.get_allocation(self.escrow_address)
        staker_info_before = self.staking_client.get_staker_info()

        self.cancel_escrow()
        self.staking_client.close_allocation(self.escrow_address)

        allocation_info_after = self.staking_client.get_allocation(self.escrow_address)
        staker_info_after = self.staking_client.get_staker_info()

        self.assertEqual(
            staker_info_after["tokens_allocated"],
            staker_info_before["tokens_allocated"] - allocation_info_before["tokens"],
        )
        self.assertEqual(allocation_info_after["tokens"], 0)
        self.assertNotEqual(allocation_info_after["closed_at"], 0)

    def test_close_allocation_invalid_escrow(self):
        with self.assertRaises(StakingClientError):
            self.staking_client.close_allocation(
                "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
            )

    def test_close_allocation_invalid_status(self):
        self.staking_client.allocate(self.escrow_address, 10)

        with self.assertRaises(StakingClientError):
            # Escrow is not cancelled/completed
            self.staking_client.close_allocation(self.escrow_address)

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
        self.assertNotEqual(staker_info_after["tokens_locked_until"], 0)

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

    def test_slash(self):
        (alice_w3, alice_gas_payer) = get_w3_with_priv_key(
            "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
        )
        alice_staking_client = StakingClient(alice_w3)

        # Alice stakes 100 HMT
        alice_staking_client.approve_stake(100)
        alice_staking_client.stake(100)

        # Alice allocates 50 HMT to new escrow
        self.create_escrow()
        alice_staking_client.allocate(self.escrow_address, 50)

        # Staker info before slashing
        staker_info_before = alice_staking_client.get_staker_info()

        # Slash 50 HMT
        self.staking_client.slash(
            self.gas_payer.address,
            alice_gas_payer.address,
            self.escrow_address,
            30,
        )

        # Staker info after slashing
        staker_info_after = alice_staking_client.get_staker_info()

        self.assertEqual(
            staker_info_after["tokens_staked"], staker_info_before["tokens_staked"] - 30
        )
        self.assertEqual(
            staker_info_after["tokens_allocated"],
            staker_info_before["tokens_allocated"] - 30,
        )

    def test_slash_invalid(self):
        (alice_w3, alice_gas_payer) = get_w3_with_priv_key(
            "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
        )
        alice_staking_client = StakingClient(alice_w3)

        # Alice stakes 100 HMT
        alice_staking_client.approve_stake(100)
        alice_staking_client.stake(100)

        # Alice allocates 50 HMT to new escrow
        self.create_escrow()
        alice_staking_client.allocate(self.escrow_address, 50)

        # Staker info before slashing
        staker_info_before = alice_staking_client.get_staker_info()

        # Slash -1 HMT
        with self.assertRaises(StakingClientError):
            self.staking_client.slash(
                self.gas_payer.address,
                alice_gas_payer.address,
                self.escrow_address,
                -1,
            )

        # Staker info after slashing
        staker_info_after = alice_staking_client.get_staker_info()

        self.assertEqual(
            staker_info_after["tokens_staked"], staker_info_before["tokens_staked"]
        )
        self.assertEqual(
            staker_info_after["tokens_allocated"],
            staker_info_before["tokens_allocated"],
        )

        # Slash more than allocated
        with self.assertRaises(StakingClientError):
            self.staking_client.slash(
                self.gas_payer.address,
                alice_gas_payer.address,
                self.escrow_address,
                100,
            )

        # Staker info after slashing
        staker_info_after = alice_staking_client.get_staker_info()

        self.assertEqual(
            staker_info_after["tokens_staked"], staker_info_before["tokens_staked"]
        )
        self.assertEqual(
            staker_info_after["tokens_allocated"],
            staker_info_before["tokens_allocated"],
        )

        # Slash invalid escrow
        with self.assertRaises(StakingClientError):
            self.staking_client.slash(
                self.gas_payer.address,
                alice_gas_payer.address,
                "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
                100,
            )

        # Staker info after slashing
        staker_info_after = alice_staking_client.get_staker_info()

        self.assertEqual(
            staker_info_after["tokens_staked"], staker_info_before["tokens_staked"]
        )
        self.assertEqual(
            staker_info_after["tokens_allocated"],
            staker_info_before["tokens_allocated"],
        )

    def test_distribute_reward(self):
        (alice_w3, alice_gas_payer) = get_w3_with_priv_key(
            "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
        )
        alice_staking_client = StakingClient(alice_w3)

        (bob_w3, bob_gas_payer) = get_w3_with_priv_key(
            "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
        )
        bob_staking_client = StakingClient(bob_w3)

        (carol_w3, carol_gas_payer) = get_w3_with_priv_key(
            "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6"
        )
        carol_staking_client = StakingClient(carol_w3)

        # Alice stakes 100 HMT
        alice_staking_client.approve_stake(100)
        alice_staking_client.stake(100)

        # Alice allocates 50 HMT to new escrow
        self.create_escrow()
        alice_staking_client.allocate(self.escrow_address, 50)

        # Bob stakes 50 HMT, and then slashes 10 HMT of Alice's allocation
        bob_staking_client.approve_stake(50)
        bob_staking_client.stake(50)

        self.staking_client.slash(
            bob_gas_payer.address,
            alice_gas_payer.address,
            self.escrow_address,
            10,
        )

        # Carol stakes 50 HMT, and then slashes 20 HMT of Alice's allocation
        carol_staking_client.approve_stake(50)
        carol_staking_client.stake(50)

        self.staking_client.slash(
            carol_gas_payer.address,
            alice_gas_payer.address,
            self.escrow_address,
            20,
        )

        # Bob HMT balance before reward distribution
        bob_hmt_balance_before = (
            bob_staking_client.hmtoken_contract.functions.balanceOf(
                bob_gas_payer.address
            ).call()
        )

        # Carol HMT balance before reward distribution
        carol_hmt_balance_before = (
            carol_staking_client.hmtoken_contract.functions.balanceOf(
                carol_gas_payer.address
            ).call()
        )

        # Distribute rewards
        self.staking_client.distribute_reward(self.escrow_address)

        # Bob HMT balance after reward distribution
        bob_hmt_balance_after = bob_staking_client.hmtoken_contract.functions.balanceOf(
            bob_gas_payer.address
        ).call()

        # Carol HMT balance after reward distribution
        carol_hmt_balance_after = (
            carol_staking_client.hmtoken_contract.functions.balanceOf(
                carol_gas_payer.address
            ).call()
        )

        # Bob HMT balance should increase by 9 HMT (1 HMT is protocol fee)
        self.assertEqual(bob_hmt_balance_after, bob_hmt_balance_before + 9)

        # Carol HMT balance should increase by 20 HMT (1 HMT is protocol fee)
        self.assertEqual(carol_hmt_balance_after, carol_hmt_balance_before + 19)

    def test_distribute_reward_invalid(self):
        with self.assertRaises(StakingClientError):
            self.staking_client.distribute_reward(
                "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
            )

    def test_get_all_stakers_info(self):
        all_stakers_info = self.staking_client.get_all_stakers_info()

        self.assertEqual(len(all_stakers_info), 4)
        self.assertEqual(
            all_stakers_info[0]["staker"].lower(),
            "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266".lower(),
        )
        self.assertEqual(
            all_stakers_info[1]["staker"].lower(),
            "0x70997970C51812dc3A010C7d01b50e0d17dc79C8".lower(),
        )
        self.assertEqual(
            all_stakers_info[2]["staker"].lower(),
            "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC".lower(),
        )
        self.assertEqual(
            all_stakers_info[3]["staker"].lower(),
            "0x90F79bf6EB2c4f870365E785982E1f101E93b906".lower(),
        )

    def test_get_staker_info(self):
        all_stakers_info = self.staking_client.get_all_stakers_info()

        staker_info = self.staking_client.get_staker_info(all_stakers_info[1]["staker"])

        self.assertEqual(
            all_stakers_info[1]["tokens_staked"], staker_info["tokens_staked"]
        )
        self.assertEqual(
            all_stakers_info[1]["tokens_allocated"], staker_info["tokens_allocated"]
        )
        self.assertEqual(
            all_stakers_info[1]["tokens_locked"], staker_info["tokens_locked"]
        )
        self.assertEqual(
            all_stakers_info[1]["tokens_locked_until"],
            staker_info["tokens_locked_until"],
        )

    def test_get_staker_info_invalid(self):
        staker_info = self.staking_client.get_staker_info(
            "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
        )
        self.assertIsNone(staker_info)

    def test_get_allocation(self):
        self.create_escrow()
        self.staking_client.allocate(self.escrow_address, 100)

        allocation = self.staking_client.get_allocation(self.escrow_address)

        self.assertEqual(allocation["escrow_address"], self.escrow_address)
        self.assertEqual(allocation["staker"], self.gas_payer.address)
        self.assertEqual(allocation["tokens"], 100)
        self.assertNotEqual(allocation["created_at"], 0)
        self.assertEqual(allocation["closed_at"], 0)

        # Close allocation
        self.cancel_escrow()
        self.staking_client.close_allocation(self.escrow_address)

        allocation = self.staking_client.get_allocation(self.escrow_address)

        self.assertEqual(allocation["escrow_address"], self.escrow_address)
        self.assertEqual(allocation["staker"], self.gas_payer.address)
        self.assertEqual(allocation["tokens"], 0)
        self.assertNotEqual(allocation["created_at"], 0)
        self.assertNotEqual(allocation["closed_at"], 0)

    def test_get_allocation_invalid_address(self):
        allocation = self.staking_client.get_allocation(
            "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
        )

        self.assertIsNone(allocation)
