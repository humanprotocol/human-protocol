import unittest
from unittest.mock import MagicMock, patch

from botocore.exceptions import ClientError

from human_protocol_sdk.storage import (
    Credentials,
    StorageClient,
    StorageClientError,
    StorageFileNotFoundError,
)


class TestCredentials(unittest.TestCase):
    def test_credentials(self):
        credentials = Credentials(access_key="my-access-key", secret_key="my-secret-key")
        self.assertEqual(credentials.access_key, "my-access-key")
        self.assertEqual(credentials.secret_key, "my-secret-key")


class TestStorageClient(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.endpoint_url = "https://s3.us-west-2.amazonaws.com"
        cls.bucket = "my-bucket"
        cls.files = ["file1.txt", "file2.txt"]
        cls.region = "us-west-2"
        cls.credentials = Credentials(access_key="my-access-key", secret_key="my-secret-key")

    def setUp(self):
        self.client = StorageClient(
            endpoint_url=self.endpoint_url,
            region=self.region,
            credentials=self.credentials,
        )

    def test_init_authenticated_access(self):
        with patch("boto3.client") as mock_client:
            client = StorageClient(
                endpoint_url=self.endpoint_url, region=self.region, credentials=self.credentials
            )
            mock_client.assert_called_once_with(
                "s3",
                aws_access_key_id=self.credentials.access_key,
                aws_secret_access_key=self.credentials.secret_key,
                region_name=self.region,
                endpoint_url=self.endpoint_url,
            )
            self.assertIsNotNone(client.client)

    def test_init_error(self):
        with patch("boto3.client") as mock_client:
            mock_client.side_effect = Exception("Connection error")
            with self.assertRaises(Exception):
                StorageClient(endpoint_url=self.endpoint_url)

    def test_download_files(self):
        expected_result = [b"file1 contents", b"file2 contents"]
        self.client.client.get_object = MagicMock(
            side_effect=[
                {"Body": MagicMock(read=MagicMock(return_value=expected_result[0]))},
                {"Body": MagicMock(read=MagicMock(return_value=expected_result[1]))},
            ]
        )
        result = self.client.download_files(files=self.files, bucket=self.bucket)
        self.assertEqual(result, expected_result)

    def test_download_files_error(self):
        self.client.client.get_object = MagicMock(
            side_effect=ClientError(
                {"Error": {"Code": "NoSuchKey", "Message": "Key not found"}},
                "GetObject",
            )
        )
        with self.assertRaises(StorageFileNotFoundError):
            self.client.download_files(files=self.files, bucket=self.bucket)

    def test_download_files_client_error(self):
        self.client.client.get_object = MagicMock(
            side_effect=ClientError(
                {"Error": {"Code": "InvalidAccessKeyId", "Message": "Access denied"}},
                "GetObject",
            )
        )
        with self.assertRaises(StorageClientError):
            self.client.download_files(files=self.files, bucket=self.bucket)

    def test_download_files_exception(self):
        self.client.client.get_object = MagicMock(side_effect=Exception("Connection error"))
        with self.assertRaises(StorageClientError):
            self.client.download_files(files=self.files, bucket=self.bucket)