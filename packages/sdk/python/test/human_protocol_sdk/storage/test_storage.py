import json
import logging
import unittest
from unittest.mock import MagicMock, patch

from human_protocol_sdk import crypto
from human_protocol_sdk.storage import upload, download, download_from_storage
from test.human_protocol_sdk.utils import test_manifest

ESCROW_TEST_BUCKETNAME = "test-escrow-results"
ESCROW_TEST_PUBLIC_BUCKETNAME = "test-escrow-public-results"

logging.getLogger("boto").setLevel(logging.INFO)
logging.getLogger("botocore").setLevel(logging.INFO)
logging.getLogger("boto3").setLevel(logging.INFO)


class StorageTest(unittest.TestCase):
    bid_amount = 1.0  # value to be inserted in manifest

    def get_manifest(self) -> dict:
        """Retrieves manifest differing bid amount to bid amount to force unique state of the manifest"""
        manifest = test_manifest(bid_amount=self.bid_amount)
        self.bid_amount += 0.1
        return dict(manifest.serialize())

    def setUp(self) -> None:
        self.pub_key = b"8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5"
        self.priv_key = (
            b"ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
        )

    @patch(
        "human_protocol_sdk.storage.ESCROW_PUBLIC_BUCKETNAME",
        ESCROW_TEST_PUBLIC_BUCKETNAME,
    )
    @patch("human_protocol_sdk.storage.ESCROW_BUCKETNAME", ESCROW_TEST_BUCKETNAME)
    def test_upload_to_private_bucket(self):
        """
        Tests uploading file to storage to private bucket when encryption is on.
        """

        s3_client_mock = MagicMock()
        with patch("human_protocol_sdk.storage._connect_s3") as mock_s3:
            mock_s3.return_value = s3_client_mock

            upload(
                self.get_manifest(),
                self.pub_key,
                encrypt_data=True,
                use_public_bucket=False,
            )

            mock_s3.assert_called()
            self.assertIn("Bucket", s3_client_mock.put_object.call_args.kwargs.keys())

            # With use_public_bucket False, bucket MUST be the private one
            self.assertEqual(
                s3_client_mock.put_object.call_args.kwargs["Bucket"],
                ESCROW_TEST_BUCKETNAME,
            )

    @patch(
        "human_protocol_sdk.storage.ESCROW_PUBLIC_BUCKETNAME",
        ESCROW_TEST_PUBLIC_BUCKETNAME,
    )
    def test_upload_to_public_bucket(self):
        """Tests uploading file to storage to public bucket only when encryption is off."""

        s3_client_mock = MagicMock()
        with patch("human_protocol_sdk.storage._connect_s3") as mock_s3:
            mock_s3.return_value = s3_client_mock

            upload(
                self.get_manifest(),
                self.pub_key,
                encrypt_data=True,
                use_public_bucket=True,
            )

            mock_s3.assert_called()

            self.assertIn("Bucket", s3_client_mock.put_object.call_args.kwargs.keys())

            # With use_public_bucket True, bucket MUST be the public one
            self.assertIn(
                s3_client_mock.put_object.call_args.kwargs["Bucket"],
                ESCROW_TEST_PUBLIC_BUCKETNAME,
            )

    def test_upload_with_enabled_encryption_option(self):
        """
        Tests data persisted in storage is encrypted.
        """
        s3_client_mock = MagicMock()
        with patch("human_protocol_sdk.storage._connect_s3") as mock_s3:
            mock_s3.return_value = s3_client_mock

            # Encryption on (default).
            data = self.get_manifest()
            upload(data, self.pub_key, encrypt_data=True)

            mock_s3.assert_called()
            self.assertIn("Body", s3_client_mock.put_object.call_args.kwargs.keys())

            # Data to be uploaded must be encrypted
            uploaded_content = crypto.decrypt(
                self.priv_key, s3_client_mock.put_object.call_args.kwargs["Body"]
            )
            self.assertEqual(json.dumps(data, sort_keys=True), uploaded_content)

    def test_upload_with_disabled_encryption_option(self):
        """
        Tests data persisted in storage is plain.
        """
        s3_client_mock = MagicMock()
        with patch("human_protocol_sdk.storage._connect_s3") as mock_s3:
            mock_s3.return_value = s3_client_mock
            # Encryption off.
            data = self.get_manifest()
            upload(data, self.pub_key, encrypt_data=False)

            mock_s3.assert_called()
            self.assertIn("Body", s3_client_mock.put_object.call_args.kwargs.keys())

            # Data to be uploaded must be plain
            uploaded_content = s3_client_mock.put_object.call_args.kwargs["Body"]
            self.assertEqual(
                json.dumps(data, sort_keys=True), uploaded_content.decode()
            )

    @patch("human_protocol_sdk.storage.ESCROW_BUCKETNAME", ESCROW_TEST_BUCKETNAME)
    def test_download_from_storage_from_private_bucket(self):
        """Tests download of file artifact from storage from private bucket."""
        # Encrypting data is on (default)
        s3_client_mock = MagicMock()
        with patch("human_protocol_sdk.storage._connect_s3") as mock_s3:
            mock_s3.return_value = s3_client_mock

            download_from_storage(key="s3aaaa", public=False)

        mock_s3.assert_called()

        # With encryption on, bucket is meant to be the public one
        self.assertEqual(
            s3_client_mock.get_object.call_args.kwargs["Bucket"], ESCROW_TEST_BUCKETNAME
        )

    @patch(
        "human_protocol_sdk.storage.ESCROW_PUBLIC_BUCKETNAME",
        ESCROW_TEST_PUBLIC_BUCKETNAME,
    )
    def test_download_from_storage_public_bucket(self):
        """Tests download of file artifact from storage from private bucket."""
        s3_client_mock = MagicMock()
        with patch("human_protocol_sdk.storage._connect_s3") as mock_s3:
            mock_s3.return_value = s3_client_mock

            download_from_storage(key="s3aaaa", public=True)

        mock_s3.assert_called()

        # With encryption on, bucket is meant to be the public one
        self.assertEqual(
            s3_client_mock.get_object.call_args.kwargs["Bucket"],
            ESCROW_TEST_PUBLIC_BUCKETNAME,
        )

    def test_public_private_download_from_storage(self):
        """Tests whether download is correctly called using public or private parameter."""
        file_key = "s3aaa"
        sample_data = '{"a": 1, "b": 2}'

        with patch("human_protocol_sdk.storage.download_from_storage") as download_mock:
            # 2 returns. 1. encrypted and other plain
            download_mock.side_effect = [
                crypto.encrypt(self.pub_key, sample_data),
                sample_data.encode("utf-8"),
            ]

            # Encryption is on (default)
            downloaded = download(key=file_key, private_key=self.priv_key, public=False)
            self.assertEqual(json.dumps(downloaded), sample_data)

            # Download from storage must be called as PRIVATE (public is FALSE)
            download_mock.assert_called_once_with(key=file_key, public=False)

            download_mock.reset_mock()

            # Encryption is on (default)
            downloaded = download(key=file_key, private_key=self.priv_key, public=True)
            self.assertEqual(json.dumps(downloaded), sample_data)

            # Download from storage must be called as PRIVATE (public is TRUE)
            download_mock.assert_called_once_with(key=file_key, public=True)

    def test_download_from_public_resource(self):
        """Download content from public URI"""
        file_key = "https://s3aaa.com"
        sample_data = '{"a": 1, "b": 2}'

        with patch("urllib.request.urlopen") as mock_urlopen:
            cm = MagicMock()
            cm.read.side_effect = [
                crypto.encrypt(self.pub_key, sample_data),
                sample_data.encode("utf-8"),
            ]
            mock_urlopen.return_value = cm

            downloaded = download(key=file_key, private_key=self.priv_key)
            self.assertEqual(json.dumps(downloaded), sample_data)
            mock_urlopen.assert_called_once()


if __name__ == "__main__":
    unittest.main(exit=True)
