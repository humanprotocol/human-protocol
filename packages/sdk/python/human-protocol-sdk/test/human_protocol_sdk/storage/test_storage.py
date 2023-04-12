import hashlib
import json
import unittest
from unittest.mock import MagicMock, patch

from botocore import UNSIGNED
from botocore.exceptions import ClientError

from human_protocol_sdk.storage import (
    Credentials,
    StorageClient,
    StorageClientError,
    StorageFileNotFoundError,
)


class TestCredentials(unittest.TestCase):
    def test_credentials(self):
        credentials = Credentials(
            access_key="my-access-key", secret_key="my-secret-key"
        )
        self.assertEqual(credentials.access_key, "my-access-key")
        self.assertEqual(credentials.secret_key, "my-secret-key")


class TestStorageClient(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.endpoint_url = "s3.us-west-2.amazonaws.com"
        cls.bucket = "my-bucket"
        cls.files = ["file1.txt", "file2.txt"]
        cls.region = "us-west-2"
        cls.credentials = Credentials(
            access_key="my-access-key", secret_key="my-secret-key"
        )

    def setUp(self):
        self.client = StorageClient(
            endpoint_url=self.endpoint_url,
            region=self.region,
            credentials=self.credentials,
        )

    def test_init(self):
        client = StorageClient(
            endpoint_url="localhost:9000",
            credentials=Credentials(access_key="dev", secret_key="devdevdev"),
        )
        result = client.bucket_exists("manifests")
        self.assertEqual(result, True)

    # def test_init_authenticated_access(self):
    #     with patch("boto3.client") as mock_client:
    #         client = StorageClient(
    #             endpoint_url=self.endpoint_url,
    #             region=self.region,
    #             credentials=self.credentials,
    #         )
    #         mock_client.assert_called_once_with(
    #             "s3",
    #             aws_access_key_id=self.credentials.access_key,
    #             aws_secret_access_key=self.credentials.secret_key,
    #             region_name=self.region,
    #             endpoint_url=self.endpoint_url,
    #         )
    #         self.assertIsNotNone(client.client)

    # def test_init_anonymous_access(self):
    #     with patch("boto3.client") as mock_client:
    #         client = StorageClient(
    #             endpoint_url=self.endpoint_url,
    #         )
    #         mock_client.assert_called_once()
    #         self.assertEqual(mock_client.call_args_list[0].args[0], "s3")
    #         self.assertEqual(
    #             mock_client.call_args_list[0].kwargs["region_name"], None)
    #         self.assertEqual(
    #             mock_client.call_args_list[0].kwargs["endpoint_url"], self.endpoint_url
    #         )
    #         self.assertEqual(
    #             mock_client.call_args_list[0].kwargs["config"].signature_version,
    #             UNSIGNED,
    #         )
    #         self.assertIsNotNone(client.client)

    # def test_init_error(self):
    #     # Endpoint URL error
    #     with self.assertRaises(ValueError):
    #         StorageClient(
    #             endpoint_url="test",
    #         )

    #     # Region error
    #     with self.assertRaises(TypeError):
    #         StorageClient(
    #             endpoint_url=self.endpoint_url,
    #             region={"test"},
    #         )

    #     # Connection error
    #     with patch("boto3.client") as mock_client:
    #         mock_client.side_effect = Exception("Connection error")
    #         with self.assertRaises(Exception):
    #             StorageClient(endpoint_url=self.endpoint_url)

    # def test_download_files(self):
    #     expected_result = [b"file1 contents", b"file2 contents"]
    #     self.client.client.get_object = MagicMock(
    #         side_effect=[
    #             {"Body": MagicMock(read=MagicMock(
    #                 return_value=expected_result[0]))},
    #             {"Body": MagicMock(read=MagicMock(
    #                 return_value=expected_result[1]))},
    #         ]
    #     )
    #     result = self.client.download_files(
    #         files=self.files, bucket=self.bucket)
    #     self.assertEqual(result, expected_result)

    # def test_download_files_error(self):
    #     self.client.client.get_object = MagicMock(
    #         side_effect=ClientError(
    #             {"Error": {"Code": "NoSuchKey", "Message": "Key not found"}},
    #             "GetObject",
    #         )
    #     )
    #     with self.assertRaises(StorageFileNotFoundError):
    #         self.client.download_files(files=self.files, bucket=self.bucket)

    # def test_download_files_anonymous_error(self):
    #     self.client.client.get_object = MagicMock(
    #         side_effect=ClientError(
    #             {"Error": {"Code": "InvalidAccessKeyId", "Message": "Access denied"}},
    #             "GetObject",
    #         )
    #     )
    #     with self.assertRaises(StorageClientError):
    #         self.client.download_files(files=self.files, bucket=self.bucket)

    # def test_download_files_exception(self):
    #     self.client.client.get_object = MagicMock(
    #         side_effect=Exception("Connection error")
    #     )
    #     with self.assertRaises(StorageClientError):
    #         self.client.download_files(files=self.files, bucket=self.bucket)

    # def test_upload_files(self):
    #     file3 = "file3 content"
    #     hash_ = hashlib.sha1(json.dumps(
    #         "file3 content").encode("utf-8")).hexdigest()
    #     key3 = f"s3{hash_}"

    #     self.client.client.head_object = MagicMock(
    #         side_effect=ClientError(
    #             {"Error": {"Code": "404", "Message": "Key not found"}},
    #             "HeadObject",
    #         )
    #     )
    #     self.client.client.upload_fileobj = MagicMock()
    #     result = self.client.upload_files(files=[file3], bucket=self.bucket)
    #     self.assertEqual(result, [key3])

    # def test_upload_files_exist(self):
    #     file3 = "file3 content"
    #     hash_ = hashlib.sha1(json.dumps(
    #         "file3 content").encode("utf-8")).hexdigest()
    #     key3 = f"s3{hash_}"

    #     self.client.client.head_object = MagicMock(
    #         side_effect=[{"ETag": "1234567890"}])
    #     self.client.client.upload_fileobj = MagicMock()
    #     result = self.client.upload_files(files=[file3], bucket=self.bucket)
    #     self.assertEqual(result, [key3])

    # def test_upload_files_error(self):
    #     file3 = "file3 content"

    #     # HeadObject error
    #     self.client.client.head_object = MagicMock(
    #         side_effect=ClientError(
    #             {"Error": {"Code": "InvalidAccessKeyId", "Message": "Access denied"}},
    #             "HeadObject",
    #         )
    #     )
    #     with self.assertRaises(StorageClientError):
    #         self.client.upload_files(files=[file3], bucket=self.bucket)

    #     # PutObject error
    #     self.client.client.upload_fileobj = MagicMock(
    #         side_effect=ClientError(
    #             {"Error": {"Code": "InvalidAccessKeyId", "Message": "Access denied"}},
    #             "HeadObject",
    #         )
    #     )
    #     with self.assertRaises(StorageClientError):
    #         self.client.upload_files(files=[file3], bucket=self.bucket)

    def test_bucket_exists(self):
        self.client.client.bucket_exists = MagicMock(side_effect=[True])
        result = self.client.bucket_exists(bucket=self.bucket)
        self.assertEqual(result, True)

    def test_bucket_exists_anonymous(self):
        client = StorageClient(
            endpoint_url=self.endpoint_url,
        )
        client.client.bucket_exists = MagicMock(side_effect=[True])
        result = client.bucket_exists(bucket=self.bucket)
        self.assertEqual(result, True)

    def test_bucket_not_exists(self):
        self.client.client.bucket_exists = MagicMock(side_effect=[False])
        result = self.client.bucket_exists(bucket=self.bucket)
        self.assertEqual(result, False)

    def test_bucket_error(self):
        self.client.client.bucket_exists = MagicMock(
            side_effect=Exception("Connection error")
        )
        with self.assertRaises(StorageClientError):
            self.client.bucket_exists(bucket=self.bucket)

    def test_list_objects(self):
        self.client.client.list_objects = MagicMock(
            side_effect=[[{"_object_name": "file1"}, {"_object_name": "file2"}]]
        )
        result = self.client.list_objects(bucket=self.bucket)
        self.assertEqual(result, ["file1", "file2"])

    def test_list_objects_anonymous(self):
        client = StorageClient(
            endpoint_url=self.endpoint_url,
        )
        client.client.list_objects = MagicMock(
            side_effect=[[{"_object_name": "file1"}, {"_object_name": "file2"}]]
        )
        result = client.list_objects(bucket=self.bucket)
        self.assertEqual(result, ["file1", "file2"])

    def test_list_objects_empty(self):
        self.client.client.list_objects = MagicMock(side_effect=[[]])
        result = self.client.list_objects(bucket=self.bucket)
        self.assertEqual(result, [])

    # def test_list_objects_error(self):
    #     self.client.client.head_bucket = MagicMock(
    #         side_effect=Exception("Connection error")
    #     )
    #     with self.assertRaises(StorageClientError):
    #         self.client.list_objects(bucket=self.bucket)
