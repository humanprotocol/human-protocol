import unittest
from unittest.mock import patch

from src.modules.chain.web3 import (
    get_web3,
    sign_message,
    recover_signer,
    validate_address,
)
from tests.utils.constants import DEFAULT_GAS_PAYER_PRIV, DEFAULT_GAS_PAYER, SIGNATURE

from human_protocol_sdk.constants import NETWORKS, ChainId
from src.config import LocalhostConfig


from web3 import Web3, HTTPProvider
from web3.middleware import construct_sign_and_send_raw_middleware


class ServiceIntegrationTest(unittest.TestCase):
    def setUp(self):
        self.w3 = Web3(HTTPProvider())

        # Set default gas payer
        self.gas_payer = self.w3.eth.account.from_key(DEFAULT_GAS_PAYER_PRIV)
        self.w3.middleware_onion.add(
            construct_sign_and_send_raw_middleware(self.gas_payer),
            "construct_sign_and_send_raw_middleware",
        )
        self.w3.eth.default_account = self.gas_payer.address

    def test_get_web3_polygon(self):
        class PolygonMainnetConfig:
            chain_id = 137
            rpc_api = "https://polygon-mainnet-rpc.com"
            private_key = DEFAULT_GAS_PAYER_PRIV

        with patch(
            "src.modules.chain.web3.Config.polygon_mainnet", PolygonMainnetConfig
        ):
            w3 = get_web3(ChainId.POLYGON.value)
        self.assertIsInstance(w3, Web3)
        self.assertEqual(w3.eth.default_account, DEFAULT_GAS_PAYER)
        self.assertEqual(
            w3.manager._provider.endpoint_uri, PolygonMainnetConfig.rpc_api
        )

    def test_get_web3_mumbai(self):
        class PolygonMumbaiConfig:
            chain_id = 80001
            rpc_api = "https://polygon-mumbai-rpc.com"
            private_key = DEFAULT_GAS_PAYER_PRIV

        with patch("src.modules.chain.web3.Config.polygon_mumbai", PolygonMumbaiConfig):
            w3 = get_web3(ChainId.POLYGON_MUMBAI.value)
        self.assertIsInstance(w3, Web3)
        self.assertEqual(w3.eth.default_account, DEFAULT_GAS_PAYER)
        self.assertEqual(w3.manager._provider.endpoint_uri, PolygonMumbaiConfig.rpc_api)

    def test_get_web3_localhost(self):
        w3 = get_web3(ChainId.LOCALHOST.value)
        self.assertIsInstance(w3, Web3)
        self.assertEqual(w3.eth.default_account, DEFAULT_GAS_PAYER)
        self.assertEqual(w3.manager._provider.endpoint_uri, LocalhostConfig.rpc_api)

    def test_get_web3_invalid_chain_id(self):
        with self.assertRaises(ValueError) as error:
            w3 = get_web3(1234)
        self.assertEqual(
            "1234 is not in available list of networks.",
            str(error.exception),
        )

    def test_sign_message_polygon(self):
        with patch("src.modules.chain.web3.get_web3") as mock_function:
            with patch(
                "src.modules.chain.web3.Config.polygon_mainnet.private_key",
                DEFAULT_GAS_PAYER_PRIV,
            ):
                mock_function.return_value = self.w3
                signed_message = sign_message(ChainId.POLYGON.value, "message")
            self.assertEqual(signed_message, SIGNATURE)

    def test_sign_message_mumbai(self):
        with patch("src.modules.chain.web3.get_web3") as mock_function:
            with patch(
                "src.modules.chain.web3.Config.polygon_mumbai.private_key",
                DEFAULT_GAS_PAYER_PRIV,
            ):
                mock_function.return_value = self.w3
                signed_message = sign_message(ChainId.POLYGON_MUMBAI.value, "message")
            self.assertEqual(signed_message, SIGNATURE)

    def test_sign_message_invalid_chain_id(self):
        with self.assertRaises(ValueError) as error:
            sign_message(1234, "message")
        self.assertEqual(
            "1234 is not in available list of networks.",
            str(error.exception),
        )

    def test_recover_signer(self):
        with patch("src.modules.chain.web3.get_web3") as mock_function:
            mock_function.return_value = self.w3
            signer = recover_signer(ChainId.POLYGON.value, "message", SIGNATURE)
        self.assertEqual(signer, DEFAULT_GAS_PAYER)

    def test_recover_signer_invalid_signature(self):
        with patch("src.modules.chain.web3.get_web3") as mock_function:
            mock_function.return_value = self.w3
            signer = recover_signer(ChainId.POLYGON.value, "test", SIGNATURE)
        self.assertNotEqual(signer, DEFAULT_GAS_PAYER)

    def test_validate_address(self):
        address = validate_address(DEFAULT_GAS_PAYER)
        self.assertEqual(address, DEFAULT_GAS_PAYER)

    def test_validate_address_invalid_address(self):
        with self.assertRaises(ValueError) as error:
            validate_address("invalid_address")
        self.assertEqual(
            f"invalid_address is not a correct Web3 address", str(error.exception)
        )
