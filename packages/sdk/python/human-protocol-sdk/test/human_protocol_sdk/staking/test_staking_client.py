import unittest
from unittest.mock import MagicMock, PropertyMock, patch

import web3
from web3 import Web3
from web3.middleware import SignAndSendRawMiddlewareBuilder
from web3.providers.rpc import HTTPProvider

from human_protocol_sdk.constants import ChainId, NETWORKS
from human_protocol_sdk.staking import (
    StakingClient,
    StakingClientError,
)

from test.human_protocol_sdk.utils import (
    DEFAULT_GAS_PAYER_PRIV,
)


class TestStakingClient(unittest.TestCase):
    def setUp(self):
        self.mock_provider = MagicMock(spec=HTTPProvider)
        self.w3 = Web3(self.mock_provider)

        # Set default gas payer
        self.gas_payer = self.w3.eth.account.from_key(DEFAULT_GAS_PAYER_PRIV)
        self.w3.middleware_onion.inject(
            SignAndSendRawMiddlewareBuilder.build(DEFAULT_GAS_PAYER_PRIV),
            "SignAndSendRawMiddlewareBuilder",
            layer=0,
        )
        self.w3.eth.default_account = self.gas_payer.address

        self.mock_chain_id = ChainId.LOCALHOST.value
        type(self.w3.eth).chain_id = PropertyMock(return_value=self.mock_chain_id)

        self.staking_client = StakingClient(self.w3)

    def test_init_with_valid_inputs(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)

        mock_chain_id = ChainId.LOCALHOST.value
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        staking_client = StakingClient(w3)

        self.assertEqual(staking_client.w3, w3)
        self.assertEqual(staking_client.network, NETWORKS[ChainId(mock_chain_id)])
        self.assertIsNotNone(staking_client.hmtoken_contract)
        self.assertIsNotNone(staking_client.factory_contract)
        self.assertIsNotNone(staking_client.staking_contract)

    def test_init_with_invalid_chain_id(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)

        mock_chain_id = 9999
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        with self.assertRaises(StakingClientError) as cm:
            StakingClient(w3)
        self.assertEqual("Invalid ChainId: 9999", str(cm.exception))

    def test_init_with_invalid_web3(self):
        mock_provider = MagicMock(spec=HTTPProvider)
        w3 = Web3(mock_provider)

        mock_chain_id = None
        type(w3.eth).chain_id = PropertyMock(return_value=mock_chain_id)

        with self.assertRaises(StakingClientError) as cm:
            StakingClient(w3)
        self.assertEqual(f"Invalid Web3 Instance", str(cm.exception))

    def test_approve_stake(self):
        mock_approve = MagicMock()
        mock_approve.transact.return_value = "tx_hash"
        self.staking_client.hmtoken_contract.functions.approve = MagicMock(
            return_value=mock_approve
        )
        self.staking_client.w3.eth.wait_for_transaction_receipt = MagicMock(
            return_value={"logs": []}
        )

        self.staking_client.approve_stake(100)

        self.staking_client.hmtoken_contract.functions.approve.assert_called_once_with(
            NETWORKS[ChainId.LOCALHOST]["staking_address"], 100
        )
        mock_approve.transact.assert_called_once_with({})
        self.staking_client.w3.eth.wait_for_transaction_receipt.assert_called_once_with(
            "tx_hash"
        )

    def test_approve_stake_invalid_amount(self):
        with self.assertRaises(StakingClientError) as cm:
            self.staking_client.approve_stake(-1)
        self.assertEqual("Amount to approve must be greater than 0", str(cm.exception))

    def test_approve_stake_with_tx_options(self):
        mock_approve = MagicMock()
        mock_approve.transact.return_value = "tx_hash"
        self.staking_client.hmtoken_contract.functions.approve = MagicMock(
            return_value=mock_approve
        )
        self.staking_client.w3.eth.wait_for_transaction_receipt = MagicMock(
            return_value={"logs": []}
        )
        tx_options = {"gas": 50000}

        self.staking_client.approve_stake(100, tx_options)

        self.staking_client.hmtoken_contract.functions.approve.assert_called_once_with(
            NETWORKS[ChainId.LOCALHOST]["staking_address"], 100
        )
        mock_approve.transact.assert_called_once_with(tx_options)
        self.staking_client.w3.eth.wait_for_transaction_receipt.assert_called_once_with(
            "tx_hash"
        )

    def test_stake(self):
        mock_stake = MagicMock()
        mock_stake.transact.return_value = "tx_hash"
        self.staking_client.staking_contract.functions.stake = MagicMock(
            return_value=mock_stake
        )
        self.staking_client.w3.eth.wait_for_transaction_receipt = MagicMock(
            return_value={"logs": []}
        )

        self.staking_client.stake(100)

        self.staking_client.staking_contract.functions.stake.assert_called_once_with(
            100
        )
        mock_stake.transact.assert_called_once_with({})
        self.staking_client.w3.eth.wait_for_transaction_receipt.assert_called_once_with(
            "tx_hash"
        )

    def test_stake_invalid_amount(self):
        with self.assertRaises(StakingClientError) as cm:
            self.staking_client.stake(-1)
        self.assertEqual("Amount to stake must be greater than 0", str(cm.exception))

    def test_stake_with_tx_options(self):
        mock_stake = MagicMock()
        mock_stake.transact.return_value = "tx_hash"
        self.staking_client.staking_contract.functions.stake = MagicMock(
            return_value=mock_stake
        )
        self.staking_client.w3.eth.wait_for_transaction_receipt = MagicMock(
            return_value={"logs": []}
        )
        tx_options = {"gas": 50000}

        self.staking_client.stake(100, tx_options)

        self.staking_client.staking_contract.functions.stake.assert_called_once_with(
            100
        )
        mock_stake.transact.assert_called_once_with(tx_options)
        self.staking_client.w3.eth.wait_for_transaction_receipt.assert_called_once_with(
            "tx_hash"
        )

    def test_unstake(self):
        mock_unstake = MagicMock()
        mock_unstake.transact.return_value = "tx_hash"
        self.staking_client.staking_contract.functions.unstake = MagicMock(
            return_value=mock_unstake
        )
        self.staking_client.w3.eth.wait_for_transaction_receipt = MagicMock(
            return_value={"logs": []}
        )

        self.staking_client.unstake(100)

        self.staking_client.staking_contract.functions.unstake.assert_called_once_with(
            100
        )
        mock_unstake.transact.assert_called_once_with({})
        self.staking_client.w3.eth.wait_for_transaction_receipt.assert_called_once_with(
            "tx_hash"
        )

    def test_unstake_invalid_amount(self):
        with self.assertRaises(StakingClientError) as cm:
            self.staking_client.unstake(-1)
        self.assertEqual("Amount to unstake must be greater than 0", str(cm.exception))

    def test_unstake_with_tx_options(self):
        mock_unstake = MagicMock()
        mock_unstake.transact.return_value = "tx_hash"
        self.staking_client.staking_contract.functions.unstake = MagicMock(
            return_value=mock_unstake
        )
        self.staking_client.w3.eth.wait_for_transaction_receipt = MagicMock(
            return_value={"logs": []}
        )
        tx_options = {"gas": 50000}

        self.staking_client.unstake(100, tx_options)

        self.staking_client.staking_contract.functions.unstake.assert_called_once_with(
            100
        )
        mock_unstake.transact.assert_called_once_with(tx_options)
        self.staking_client.w3.eth.wait_for_transaction_receipt.assert_called_once_with(
            "tx_hash"
        )

    def test_withdraw(self):
        mock_withdraw = MagicMock()
        mock_withdraw.transact.return_value = "tx_hash"
        self.staking_client.staking_contract.functions.withdraw = MagicMock(
            return_value=mock_withdraw
        )
        self.staking_client.w3.eth.wait_for_transaction_receipt = MagicMock(
            return_value={"logs": []}
        )

        self.staking_client.withdraw()

        self.staking_client.staking_contract.functions.withdraw.assert_called_once_with()
        mock_withdraw.transact.assert_called_once_with({})
        self.staking_client.w3.eth.wait_for_transaction_receipt.assert_called_once_with(
            "tx_hash"
        )

    def test_withdraw_with_tx_options(self):
        mock_withdraw = MagicMock()
        mock_withdraw.transact.return_value = "tx_hash"
        self.staking_client.staking_contract.functions.withdraw = MagicMock(
            return_value=mock_withdraw
        )
        self.staking_client.w3.eth.wait_for_transaction_receipt = MagicMock(
            return_value={"logs": []}
        )
        tx_options = {"gas": 50000}

        self.staking_client.withdraw(tx_options)

        self.staking_client.staking_contract.functions.withdraw.assert_called_once_with()
        mock_withdraw.transact.assert_called_once_with(tx_options)
        self.staking_client.w3.eth.wait_for_transaction_receipt.assert_called_once_with(
            "tx_hash"
        )

    def test_slash(self):
        slasher = "SLASHER"
        staker = "STAKER"
        escrow_address = "escrow1"
        self.staking_client._is_valid_escrow = MagicMock(return_value=True)

        mock_slash = MagicMock()
        mock_slash.transact.return_value = "tx_hash"
        self.staking_client.staking_contract.functions.slash = MagicMock(
            return_value=mock_slash
        )
        self.staking_client.w3.eth.wait_for_transaction_receipt = MagicMock(
            return_value={"logs": []}
        )

        self.staking_client.slash(
            slasher=slasher,
            staker=staker,
            escrow_address=escrow_address,
            amount=50,
        )

        self.staking_client.staking_contract.functions.slash.assert_called_once_with(
            slasher, staker, escrow_address, 50
        )
        mock_slash.transact.assert_called_once_with({})
        self.staking_client.w3.eth.wait_for_transaction_receipt.assert_called_once_with(
            "tx_hash"
        )

    def test_slash_invalid_amount(self):
        slasher = "SLASHER"
        staker = "STAKER"
        escrow_address = "escrow1"
        self.staking_client._is_valid_escrow = MagicMock(return_value=True)

        with self.assertRaises(StakingClientError) as cm:
            self.staking_client.slash(
                slasher=slasher, staker=staker, escrow_address=escrow_address, amount=-1
            )
        self.assertEqual("Amount to slash must be greater than 0", str(cm.exception))

    def test_slash_invalid_escrow(self):
        slasher = "SLASHER"
        staker = "STAKER"
        escrow_address = "invalid_escrow"
        self.staking_client._is_valid_escrow = MagicMock(return_value=False)

        with self.assertRaises(StakingClientError) as cm:
            self.staking_client.slash(
                slasher=slasher, staker=staker, escrow_address=escrow_address, amount=10
            )
        self.assertEqual("Invalid escrow address: invalid_escrow", str(cm.exception))

    def test_slash_with_tx_options(self):
        slasher = "SLASHER"
        staker = "STAKER"
        escrow_address = "escrow1"
        self.staking_client._is_valid_escrow = MagicMock(return_value=True)

        mock_slash = MagicMock()
        mock_slash.transact.return_value = "tx_hash"
        self.staking_client.staking_contract.functions.slash = MagicMock(
            return_value=mock_slash
        )
        self.staking_client.w3.eth.wait_for_transaction_receipt = MagicMock(
            return_value={"logs": []}
        )
        tx_options = {"gas": 50000}

        self.staking_client.slash(
            slasher=slasher,
            staker=staker,
            escrow_address=escrow_address,
            amount=50,
            tx_options=tx_options,
        )

        self.staking_client.staking_contract.functions.slash.assert_called_once_with(
            slasher, staker, escrow_address, 50
        )
        mock_slash.transact.assert_called_once_with(tx_options)
        self.staking_client.w3.eth.wait_for_transaction_receipt.assert_called_once_with(
            "tx_hash"
        )

    def test_get_staker_info(self):
        staker_address = "0x1234567890123456789012345678901234567890"
        staker_info = [100, 50, 1234567890]
        current_block = 1234567880

        self.staking_client.staking_contract.functions.stakes = MagicMock(
            return_value=MagicMock(call=MagicMock(return_value=staker_info))
        )

        type(self.w3.eth).block_number = PropertyMock(return_value=current_block)

        result = self.staking_client.get_staker_info(staker_address)

        self.assertEqual(
            result,
            {
                "stakedAmount": staker_info[0],
                "lockedAmount": staker_info[1],
                "lockedUntil": staker_info[2],
                "withdrawableAmount": 0,
            },
        )
        self.staking_client.staking_contract.functions.stakes.assert_called_once_with(
            staker_address
        )

    def test_get_staker_info_with_locked_amount_0_and_withdrawable_tokens(self):
        staker_address = "0x1234567890123456789012345678901234567890"
        staker_info = [100, 50, 1234567890]
        current_block = 1234567891

        self.staking_client.staking_contract.functions.stakes = MagicMock(
            return_value=MagicMock(call=MagicMock(return_value=staker_info))
        )

        type(self.w3.eth).block_number = PropertyMock(return_value=current_block)

        result = self.staking_client.get_staker_info(staker_address)

        self.assertEqual(
            result,
            {
                "stakedAmount": staker_info[0],
                "lockedAmount": 0,
                "lockedUntil": 0,
                "withdrawableAmount": staker_info[1],
            },
        )
        self.staking_client.staking_contract.functions.stakes.assert_called_once_with(
            staker_address
        )

    def test_get_staker_info_invalid_address(self):
        invalid_address = "invalid_address"

        with self.assertRaises(StakingClientError) as cm:
            self.staking_client.get_staker_info(invalid_address)
        self.assertEqual(
            f"Invalid staker address: {invalid_address}", str(cm.exception)
        )

    def test_get_staker_info_fails(self):
        staker_address = "0x1234567890123456789012345678901234567890"
        self.staking_client.staking_contract.functions.stakes = MagicMock(
            side_effect=Exception("Failed to get staker info")
        )

        with self.assertRaises(StakingClientError) as cm:
            self.staking_client.get_staker_info(staker_address)
        self.assertEqual(
            "Failed to get staker info: Failed to get staker info", str(cm.exception)
        )


if __name__ == "__main__":
    unittest.main(exit=True)
