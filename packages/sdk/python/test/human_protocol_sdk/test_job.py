#!/usr/bin/env python3
import unittest
from decimal import Decimal
from unittest.mock import MagicMock, patch, call

from human_protocol_sdk import utils
from human_protocol_sdk.eth_bridge import (
    deploy_factory,
    get_w3,
    Retry,
)
from human_protocol_sdk.job import (
    Job,
    status,
    Status,
    manifest_hash,
    launcher,
    is_trusted_handler,
)
from human_protocol_sdk.storage import get_public_bucket_url
from test.human_protocol_sdk.utils.manifest import manifest
from test.human_protocol_sdk.utils.job import DEFAULT_GAS_PAYER, DEFAULT_GAS_PAYER_PRIV


@patch("human_protocol_sdk.storage._connect_s3", MagicMock(), create=True)
@patch("human_protocol_sdk.job.download", MagicMock(return_value=manifest), create=True)
class JobTestCase(unittest.TestCase):
    def setUp(self):
        self.credentials = {
            "gas_payer": DEFAULT_GAS_PAYER,
            "gas_payer_priv": DEFAULT_GAS_PAYER_PRIV,
        }
        self.rep_oracle_pub_key = b"8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5"
        self.job = Job(self.credentials, manifest)

    def test_launch(self):
        """Tests job launch"""
        lauched = self.job.launch(self.rep_oracle_pub_key)
        self.assertEqual(lauched, True)

        next_status = status(self.job.job_contract, self.job.gas_payer)
        self.assertEqual(next_status, Status.Launched)

    def test_status(self):
        lauched = self.job.launch(self.rep_oracle_pub_key)
        self.assertEqual(lauched, True)

        next_status = status(self.job.job_contract, self.job.gas_payer)
        self.assertEqual(next_status, Status.Launched)

    def test_manifest_url(self):
        self.assertTrue(self.job.launch(self.rep_oracle_pub_key))
        self.assertTrue(self.job.setup())
        self.assertEqual(
            manifest_hash(self.job.job_contract, self.job.gas_payer),
            self.job.manifest_hash,
        )

    def test_job_init(self):
        # Creating a new Job instance initializes the critical attributes correctly.
        self.assertEqual(self.job.gas_payer, self.credentials["gas_payer"])
        self.assertEqual(self.job.gas_payer_priv, self.credentials["gas_payer_priv"])
        self.assertEqual(self.job.serialized_manifest["oracle_stake"], "0.05")
        self.assertEqual(self.job.amount, Decimal("100.0"))

        # Initializing a new Job instance with a factory address succeeds.
        factory_addr = deploy_factory(**(self.credentials))
        self.job = Job(self.credentials, manifest, factory_addr)
        self.assertTrue(self.job.factory_contract.address, factory_addr)
        self.assertTrue(self.job.launch(self.rep_oracle_pub_key))
        self.assertTrue(self.job.setup())
        self.assertTrue(
            launcher(self.job.job_contract, self.credentials["gas_payer"]).lower(),
            self.job.factory_contract.address.lower(),
        )

        # Initializing an existing Job instance with a factory and escrow address succeeds.
        self.credentials[
            "rep_oracle_priv_key"
        ] = b"ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
        escrow_addr = self.job.job_contract.address
        factory_addr = self.job.factory_contract.address
        manifest_url = self.job.manifest_url
        new_job = Job(
            credentials=self.credentials,
            factory_addr=factory_addr,
            escrow_addr=escrow_addr,
        )
        self.assertEqual(new_job.manifest_url, manifest_url)
        self.assertEqual(new_job.job_contract.address, escrow_addr)
        self.assertEqual(new_job.factory_contract.address, factory_addr)
        with self.assertRaises(AttributeError):
            new_job.launch(self.rep_oracle_pub_key)

    def test_job_launch(self):
        self.assertTrue(self.job.launch(self.rep_oracle_pub_key))
        self.assertEqual(self.job.status(), Status(1))
        multi_credentials = [
            (
                "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
                "59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
            ),
            (
                "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
                "5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
            ),
        ]
        self.job = Job(self.credentials, manifest, multi_credentials=multi_credentials)

        # Inject wrong credentials on purpose to test out raffling

        self.job.gas_payer_priv = (
            "657b6497a355a3982928d5515d48a84870f057c4d16923eb1d104c0afada9aa8"
        )
        self.job.multi_credentials = [
            (
                "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
                DEFAULT_GAS_PAYER_PRIV,
            ),
            (
                "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
                "5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
            ),
        ]
        self.assertTrue(self.job.launch(self.rep_oracle_pub_key))
        self.assertEqual(self.job.status(), Status(1))

        # Make sure we launched with raffled credentials

        self.assertEqual(
            self.job.gas_payer, "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
        )
        self.assertEqual(
            self.job.gas_payer_priv,
            "5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
        )

    def test_job_setup(self):
        # A Job can't be setup without deploying it first.

        self.assertFalse(self.job.setup())
        multi_credentials = [
            (
                "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
                DEFAULT_GAS_PAYER_PRIV,
            ),
            (
                "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
                "5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
            ),
        ]
        self.job = Job(self.credentials, manifest, multi_credentials=multi_credentials)
        self.assertTrue(self.job.launch(self.rep_oracle_pub_key))
        self.assertTrue(self.job.setup())

    def test_job_add_trusted_handlers(self):
        # Make sure we se set our gas payer as a trusted handler by default.

        self.assertTrue(self.job.launch(self.rep_oracle_pub_key))
        self.assertTrue(
            is_trusted_handler(
                self.job.job_contract, self.job.gas_payer, self.job.gas_payer
            )
        )
        trusted_handlers = [
            "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
            "0xD979105297fB0eee83F7433fC09279cb5B94fFC6",
        ]
        self.assertTrue(self.job.add_trusted_handlers(trusted_handlers))
        self.assertTrue(
            is_trusted_handler(
                self.job.job_contract,
                "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
                self.job.gas_payer,
            )
        )
        self.assertTrue(
            is_trusted_handler(
                self.job.job_contract,
                "0xD979105297fB0eee83F7433fC09279cb5B94fFC6",
                self.job.gas_payer,
            )
        )

    def test_job_bulk_payout(self):
        """Tests job's bulk payout."""
        self.assertTrue(self.job.launch(self.rep_oracle_pub_key))
        self.assertTrue(self.job.setup())
        payouts = [
            ("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", Decimal("20.0")),
            ("0x852023fbb19050B8291a335E5A83Ac9701E7B4E6", Decimal("50.0")),
        ]
        self.assertTrue(self.job.bulk_payout(payouts, {}, self.rep_oracle_pub_key))

        # The escrow contract is still in Partial state as there's still balance left.

        self.assertEqual(self.job.balance(), 30000000000000000000)
        self.assertEqual(self.job.status(), Status(3))

        # Trying to pay more than the contract balance results in failure.

        payouts = [("0x9d689b8f50Fd2CAec716Cc5220bEd66E03F07B5f", Decimal("40.0"))]
        self.assertFalse(self.job.bulk_payout(payouts, {}, self.rep_oracle_pub_key))

        # Paying the remaining amount empties the escrow and updates the status correctly.

        payouts = [("0x9d689b8f50Fd2CAec716Cc5220bEd66E03F07B5f", Decimal("30.0"))]
        self.assertTrue(self.job.bulk_payout(payouts, {}, self.rep_oracle_pub_key))
        self.assertEqual(self.job.balance(), 0)
        self.assertEqual(self.job.status(), Status(4))

        multi_credentials = [
            (
                "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
                "59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
            ),
            (
                "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
                "5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
            ),
        ]
        self.job = Job(self.credentials, manifest, multi_credentials=multi_credentials)
        self.assertTrue(self.job.launch(self.rep_oracle_pub_key))
        self.assertTrue(self.job.setup())
        payouts = [
            ("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", Decimal("20.0")),
            ("0x852023fbb19050B8291a335E5A83Ac9701E7B4E6", Decimal("50.0")),
        ]
        self.assertTrue(self.job.bulk_payout(payouts, {}, self.rep_oracle_pub_key))

    def test_job_bulk_payout_with_false_encryption_option(self):
        """Test that final results are stored encrypted"""
        job = Job(self.credentials, manifest)
        self.assertEqual(job.launch(self.rep_oracle_pub_key), True)
        self.assertEqual(job.setup(), True)

        payouts = [("0x852023fbb19050B8291a335E5A83Ac9701E7B4E6", Decimal("100.0"))]

        final_results = {"results": 0}

        mock_upload = MagicMock(return_value=("hash", "url"))

        # Testing option as: do not encrypt final results: encrypt_final_results=False
        with patch("human_protocol_sdk.job.upload", mock_upload):
            # Bulk payout with final results as plain (not encrypted)
            job.bulk_payout(
                payouts=payouts,
                results=final_results,
                pub_key=self.rep_oracle_pub_key,
                encrypt_final_results=False,
            )

            mock_upload.assert_called_once_with(
                msg=final_results,
                public_key=self.rep_oracle_pub_key,
                encrypt_data=False,
                use_public_bucket=False,
            )

    def test_job_bulk_payout_with_true_encryption_option(self):
        """Test that final results are stored uncrypted"""
        job = Job(self.credentials, manifest)
        self.assertEqual(job.launch(self.rep_oracle_pub_key), True)
        self.assertEqual(job.setup(), True)

        payouts = [("0x852023fbb19050B8291a335E5A83Ac9701E7B4E6", Decimal("100.0"))]

        final_results = {"results": 0}

        mock_upload = MagicMock(return_value=("hash", "url"))

        # Testing option as: encrypt final results: encrypt_final_results=True
        with patch("hmt_escrow.job.upload") as mock_upload:
            # Bulk payout with final results as plain (not encrypted)
            mock_upload.return_value = ("hash", "url")

            job.bulk_payout(
                payouts=payouts,
                results=final_results,
                pub_key=self.rep_oracle_pub_key,
                encrypt_final_results=True,
            )

            mock_upload.assert_called_once_with(
                msg=final_results,
                public_key=self.rep_oracle_pub_key,
                encrypt_data=True,
                use_public_bucket=False,
            )

    def test_job_bulk_payout_store_final_results_publicly_and_privately(self):
        """Tests bulk payout with option to store final results privately/publicly"""

        job = Job(self.credentials, manifest)
        self.assertEqual(job.launch(self.rep_oracle_pub_key), True)
        self.assertEqual(job.setup(), True)

        payouts = [("0x852023fbb19050B8291a335E5A83Ac9701E7B4E6", Decimal("100.0"))]

        final_results = {"results": 0}

        mock_upload = MagicMock(return_value=("hash", "url"))

        with patch("human_protocol_sdk.job.upload", mock_upload):
            # Bulk payout with with option to store privately
            job.bulk_payout(
                payouts=payouts,
                results=final_results,
                pub_key=self.rep_oracle_pub_key,
                encrypt_final_results=False,
                store_pub_final_results=False,
            )

            mock_upload.assert_called_once_with(
                msg=final_results,
                public_key=self.rep_oracle_pub_key,
                encrypt_data=False,
                use_public_bucket=False,
            )
            mock_upload.reset_mock()

            # Bulk payout with with option to store publicly
            job.bulk_payout(
                payouts=payouts,
                results=final_results,
                pub_key=self.rep_oracle_pub_key,
                encrypt_final_results=False,
                store_pub_final_results=True,
            )

            mock_upload.assert_called_once_with(
                msg=final_results,
                public_key=self.rep_oracle_pub_key,
                encrypt_data=False,
                use_public_bucket=True,
            )

    def test_job_bulk_payout_with_full_qualified_url(self):
        """Tests whether url is only S3 string with encryption is on/off."""
        job = Job(self.credentials, manifest)
        self.assertEqual(job.launch(self.rep_oracle_pub_key), True)
        self.assertEqual(job.setup(), True)

        payouts = [("0x852023fbb19050B8291a335E5A83Ac9701E7B4E6", Decimal("100.0"))]

        final_results = {"results": 0}

        with patch(
            "hmt_escrow.job.handle_transaction_with_retry"
        ) as transaction_retry_mock, patch(
            "hmt_escrow.job.upload"
        ) as upload_mock, patch.object(
            Job, "_check_transfer_event"
        ) as _check_transfer_event_mock:
            key = "abcdefg"
            hash_ = f"s3{key}"
            upload_mock.return_value = hash_, key
            _check_transfer_event_mock.return_value = True

            # Bulk payout with option to store final results privately
            job.bulk_payout(
                payouts=payouts,
                results=final_results,
                pub_key=self.rep_oracle_pub_key,
                encrypt_final_results=False,
                store_pub_final_results=False,
            )

            # Key was passed to handle_transaction_with_retry as URL
            self.assertIn(key, transaction_retry_mock.call_args.args)

            transaction_retry_mock.reset_mock()

            # Bulk payout with option to store final results publicly
            job.bulk_payout(
                payouts=payouts,
                results=final_results,
                pub_key=self.rep_oracle_pub_key,
                encrypt_final_results=False,
                store_pub_final_results=True,
            )

            # Key MUST NOT be passed as URL in handle_transaction_with_retry
            self.assertNotIn(key, transaction_retry_mock.call_args.args)

            # Full bucket URL must be persisted in blockchain during bulk payout
            full_url = get_public_bucket_url(key)
            self.assertIn(full_url, transaction_retry_mock.call_args.args)

    def test_retrieving_encrypted_final_results(self):
        """Tests retrieving final results with encryption on/off"""

        job = Job(self.credentials, manifest)
        self.assertEqual(job.launch(self.rep_oracle_pub_key), True)
        self.assertEqual(job.setup(), True)

        with patch("human_protocol_sdk.job.download") as download_mock:
            download_mock.return_value = {"results": 0}

            # No bulk payout processed to have final results
            persisted_final_results = job.final_results(
                self.credentials["gas_payer_priv"].encode("utf-8")
            )
            self.assertIsNone(persisted_final_results)

            payouts = [("0x852023fbb19050B8291a335E5A83Ac9701E7B4E6", Decimal("100.0"))]

            final_results = {"results": 0}

            # Bulk payout with encryption ON (default)
            job.bulk_payout(
                payouts=payouts,
                results=final_results,
                pub_key=self.rep_oracle_pub_key,
                encrypt_final_results=True,
                store_pub_final_results=False,
            )

            persisted_final_results = job.final_results(
                self.credentials["gas_payer_priv"].encode("utf-8")
            )
            self.assertEqual(persisted_final_results, final_results)

            # Bulk payout with encryption OFF
            job = Job(self.credentials, manifest)
            self.assertEqual(job.launch(self.rep_oracle_pub_key), True)
            self.assertEqual(job.setup(), True)

            job.bulk_payout(
                payouts=payouts,
                results=final_results,
                pub_key=self.rep_oracle_pub_key,
                encrypt_final_results=False,
                store_pub_final_results=False,
            )

            persisted_final_results = job.final_results(
                self.credentials["gas_payer_priv"].encode("utf-8")
            )
            self.assertEqual(persisted_final_results, final_results)

    def test_job_abort(self):
        """
        The escrow contract is in Paid state after the full bulk payout, and
            it can't be aborted.
        """

        self.assertTrue(self.job.launch(self.rep_oracle_pub_key))
        self.assertTrue(self.job.setup())
        payouts = [("0x852023fbb19050B8291a335E5A83Ac9701E7B4E6", Decimal("100.0"))]
        self.assertTrue(
            self.job.bulk_payout(payouts, {"results": 0}, self.rep_oracle_pub_key)
        )
        self.assertFalse(self.job.abort())
        self.assertEqual(self.job.status(), Status(4))

        # Trusted handler should be able to abort an existing contract

        self.job = Job(self.credentials, manifest)
        self.assertTrue(self.job.launch(self.rep_oracle_pub_key))
        self.assertTrue(self.job.setup())
        trusted_handler = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
        self.assertTrue(self.job.add_trusted_handlers([trusted_handler]))

        handler_credentials = {
            "gas_payer": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
            "gas_payer_priv": "5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
            "rep_oracle_priv_key": b"ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
        }
        access_job = Job(
            credentials=handler_credentials,
            factory_addr=self.job.factory_contract.address,
            escrow_addr=self.job.job_contract.address,
        )
        self.assertTrue(access_job.abort())

    def test_job_cancel(self):
        self.assertTrue(self.job.launch(self.rep_oracle_pub_key))
        self.assertTrue(self.job.setup())
        payouts = [("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", Decimal("20.0"))]
        self.assertTrue(self.job.bulk_payout(payouts, {}, self.rep_oracle_pub_key))
        self.assertEqual(self.job.status(), Status(3))

        # The escrow contract is in Paid state after the second payout and it can't be cancelled.

        payouts = [("0x852023fbb19050B8291a335E5A83Ac9701E7B4E6", Decimal("80.0"))]
        self.assertTrue(
            self.job.bulk_payout(payouts, {"results": 0}, self.rep_oracle_pub_key)
        )
        self.assertFalse(self.job.cancel())
        self.assertEqual(self.job.status(), Status(4))

    def test_job_status(self):
        self.assertTrue(self.job.launch(self.rep_oracle_pub_key))
        self.assertEqual(self.job.status(), Status(1))

    def test_job_balance(self):
        self.assertTrue(self.job.launch(self.rep_oracle_pub_key))
        self.assertTrue(self.job.setup())
        self.assertEqual(self.job.balance(), 100000000000000000000)

    def test_launch_failure(self):
        """Test _launch raises error on failure to create contract"""

        handler_mock = MagicMock()
        handler_mock.side_effect = Exception("")

        e = None
        with self.assertRaises(Exception) as e:
            with patch(
                "human_protocol_sdk.eth_bridge.handle_transaction", handler_mock
            ):
                self.job.launch(b"")

        self.assertIsNotNone(e)
        self.assertEqual(str(e.exception), "Unable to create escrow")

    def test__raffle_txn_retry(self):
        """Test general retry logic"""

        retries = 4
        delay = 0.01
        backoff = 2
        self.job.retry = Retry(retries=retries, delay=delay, backoff=backoff)

        txn_mock = MagicMock()
        handler_mock = MagicMock(side_effect=Exception)
        sleep_mock = MagicMock()

        with patch(
            "human_protocol_sdk.eth_bridge.handle_transaction", handler_mock
        ), patch("human_protocol_sdk.eth_bridge.sleep", sleep_mock):
            raffle_txn_res = self.job._raffle_txn(
                multi_creds=[("1", "11")],
                txn_func=txn_mock,
                txn_args=[],
                txn_event="Transfer",
            )

            self.assertFalse(raffle_txn_res["txn_succeeded"])

            self.assertEqual(
                handler_mock.call_args_list,
                [
                    call(
                        txn_mock,
                        gas_payer="1",
                        gas_payer_priv="11",
                        gas=4712388,
                        hmt_server_addr=None,
                    )
                    for i in range(5)
                ],
            )
            self.assertEqual(
                sleep_mock.call_args_list,
                [call(delay * backoff**i) for i in range(retries)],
            )

            sleep_mock.reset_mock()
            handler_mock.reset_mock()
            handler_mock.side_effect = Exception

            # no retries
            self.job.retry = Retry()

            raffle_txn_res = self.job._raffle_txn(
                multi_creds=[("1", "11")],
                txn_func=txn_mock,
                txn_args=[],
                txn_event="Transfer",
            )

            self.assertFalse(raffle_txn_res["txn_succeeded"])
            self.assertEqual(
                handler_mock.call_args_list,
                [
                    call(
                        txn_mock,
                        gas_payer="1",
                        gas_payer_priv="11",
                        gas=4712388,
                        hmt_server_addr=None,
                    )
                ],
            )
            self.assertEqual(sleep_mock.call_args_list, [])

    def test_get_hmt_balance(self):
        """Test wallet HMT balance is OK"""
        amount = utils.get_hmt_balance(
            DEFAULT_GAS_PAYER,
            "0x5FbDB2315678afecb367f032d93F642f64180aa3",
            get_w3(),
        )

        self.assertGreater(amount, 10000)


if __name__ == "__main__":
    unittest.main(exit=True)
