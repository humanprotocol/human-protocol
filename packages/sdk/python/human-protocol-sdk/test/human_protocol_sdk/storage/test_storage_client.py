import hashlib
import json
import random
import unittest
from unittest.mock import MagicMock, patch
import types
from minio import S3Error

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

    def test_init_authenticated_access(self):
        with patch("human_protocol_sdk.storage.storage_client.Minio") as mock_client:
            client = StorageClient(
                endpoint_url=self.endpoint_url,
                region=self.region,
                credentials=self.credentials,
            )
            mock_client.assert_called_once_with(
                access_key=self.credentials.access_key,
                secret_key=self.credentials.secret_key,
                region=self.region,
                endpoint=self.endpoint_url,
                secure=True,
            )
            self.assertIsNotNone(client.client)

    def test_init_anonymous_access(self):
        with patch("human_protocol_sdk.storage.storage_client.Minio") as mock_client:
            client = StorageClient(
                endpoint_url=self.endpoint_url,
            )
            mock_client.assert_called_once()
            self.assertEqual(mock_client.call_args_list[0].kwargs["region"], None)
            self.assertEqual(
                mock_client.call_args_list[0].kwargs["endpoint"], self.endpoint_url
            )
            self.assertIsNotNone(client.client)

    def test_init_error(self):
        # Connection error
        with patch("human_protocol_sdk.storage.storage_client.Minio") as mock_client:
            mock_client.side_effect = Exception("Connection error")
            with self.assertRaises(Exception):
                StorageClient(endpoint_url=self.endpoint_url)

    def test_download_files(self):
        expected_result = [b"file1 contents", b"file2 contents"]
        self.client.client.get_object = MagicMock(
            side_effect=[
                MagicMock(read=MagicMock(return_value=expected_result[0])),
                MagicMock(read=MagicMock(return_value=expected_result[1])),
            ]
        )
        result = self.client.download_files(files=self.files, bucket=self.bucket)
        self.assertEqual(result, expected_result)

    def test_download_files_error(self):
        self.client.client.get_object = MagicMock(
            side_effect=S3Error(
                code="NoSuchKey",
                message="Key not found",
                resource="",
                request_id="",
                host_id="",
                response="",
            )
        )
        with self.assertRaises(StorageFileNotFoundError):
            self.client.download_files(files=self.files, bucket=self.bucket)

    def test_download_files_anonymous_error(self):
        self.client.client.get_object = MagicMock(
            side_effect=S3Error(
                code="InvalidAccessKeyId",
                message="Access denied",
                resource="",
                request_id="",
                host_id="",
                response="",
            )
        )
        with self.assertRaises(StorageClientError):
            self.client.download_files(files=self.files, bucket=self.bucket)

    def test_download_files_exception(self):
        self.client.client.get_object = MagicMock(
            side_effect=Exception("Connection error")
        )
        with self.assertRaises(StorageClientError):
            self.client.download_files(files=self.files, bucket=self.bucket)

    def test_upload_files(self):
        file3 = "file3 content"
        hash = hashlib.sha1(json.dumps("file3 content").encode("utf-8")).hexdigest()
        key3 = f"s3{hash}.json"

        self.client.client.stat_object = MagicMock(
            side_effect=S3Error(
                code="NoSuchKey",
                message="Object does not exist",
                resource="",
                request_id="",
                host_id="",
                response="",
            )
        )
        self.client.client.put_object = MagicMock()
        result = self.client.upload_files(files=[file3], bucket=self.bucket)
        self.assertEqual(result[0]["key"], key3)
        self.assertEqual(
            result[0]["url"], f"https://s3.us-west-2.amazonaws.com/my-bucket/{key3}"
        )
        self.assertEqual(result[0]["hash"], hash)

    def test_upload_encrypted_files(self):
        encrypted_file = "encrypted file content"
        hash = hashlib.sha1(json.dumps(encrypted_file).encode("utf-8")).hexdigest()
        encrypted_file_key = f"s3{hash}"
        file = {
            "file": encrypted_file.encode("utf-8"),
            "hash": hash,
            "key": encrypted_file_key,
        }

        self.client.client.stat_object = MagicMock(
            side_effect=S3Error(
                code="NoSuchKey",
                message="Object does not exist",
                resource="",
                request_id="",
                host_id="",
                response="",
            )
        )
        self.client.client.put_object = MagicMock()
        result = self.client.upload_files(files=[file], bucket=self.bucket)
        self.assertEqual(result[0]["key"], encrypted_file_key)
        self.assertEqual(
            result[0]["url"],
            f"https://s3.us-west-2.amazonaws.com/my-bucket/{encrypted_file_key}",
        )
        self.assertEqual(result[0]["hash"], hash)

    def test_upload_files_exist(self):
        file3 = "file3 content"
        hash = hashlib.sha1(json.dumps("file3 content").encode("utf-8")).hexdigest()
        key3 = f"s3{hash}.json"

        self.client.client.stat_object = MagicMock(
            side_effect=[{"_object_name": "1234567890"}]
        )
        self.client.client.put_object = MagicMock()
        result = self.client.upload_files(files=[file3], bucket=self.bucket)
        self.assertEqual(result[0]["key"], key3)
        self.assertEqual(
            result[0]["url"], f"https://s3.us-west-2.amazonaws.com/my-bucket/{key3}"
        )
        self.assertEqual(result[0]["hash"], hash)

    def test_upload_files_error(self):
        file3 = "file3 content"

        # HeadObject error
        self.client.client.head_object = MagicMock(
            side_effect=S3Error(
                code="InvalidAccessKeyId",
                message="Access denied",
                resource="",
                request_id="",
                host_id="",
                response="",
            )
        )
        with self.assertRaises(StorageClientError):
            self.client.upload_files(files=[file3], bucket=self.bucket)

        # PutObject error
        self.client.client.upload_fileobj = MagicMock(
            side_effect=S3Error(
                code="InvalidAccessKeyId",
                message="Access denied",
                resource="",
                request_id="",
                host_id="",
                response="",
            )
        )
        with self.assertRaises(StorageClientError):
            self.client.upload_files(files=[file3], bucket=self.bucket)

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
        file1 = types.SimpleNamespace()
        file2 = types.SimpleNamespace()
        file1._object_name = "file1"
        file2._object_name = "file2"
        self.client.client.list_objects = MagicMock(side_effect=[[file1, file2]])
        result = self.client.list_objects(bucket=self.bucket)
        self.assertEqual(result, ["file1", "file2"])

    def test_list_objects_anonymous(self):
        client = StorageClient(
            endpoint_url=self.endpoint_url,
        )
        file1 = types.SimpleNamespace()
        file2 = types.SimpleNamespace()
        file1._object_name = "file1"
        file2._object_name = "file2"
        client.client.list_objects = MagicMock(side_effect=[[file1, file2]])
        result = client.list_objects(bucket=self.bucket)
        self.assertEqual(result, ["file1", "file2"])

    def test_list_objects_empty(self):
        self.client.client.list_objects = MagicMock(side_effect=[[]])
        result = self.client.list_objects(bucket=self.bucket)
        self.assertEqual(result, [])

    def test_list_objects_error(self):
        self.client.client.head_bucket = MagicMock(
            side_effect=Exception("Connection error")
        )
        with self.assertRaises(StorageClientError):
            self.client.list_objects(bucket=self.bucket)

    def test_list_objects_length(self):
        expected_length = random.randint(1, 10)
        mock_client = MagicMock()
        mock_client.list_objects.return_value = [
            types.SimpleNamespace(_object_name=f"file{i}")
            for i in range(expected_length)
        ]
        with patch(
            "human_protocol_sdk.storage.storage_client.Minio", return_value=mock_client
        ):
            client = StorageClient(endpoint_url="https://example.com", credentials=None)
            object_list = client.list_objects(bucket="my-bucket")
            self.assertEqual(len(object_list), expected_length)

    def test_list_objects_length_error(self):
        expected_length = random.randint(1, 10)
        mock_client = MagicMock()
        mock_client.list_objects.return_value = [
            types.SimpleNamespace(_object_name=f"file{i}")
            for i in range(expected_length)
        ]
        with patch(
            "human_protocol_sdk.storage.storage_client.Minio", return_value=mock_client
        ):
            client = StorageClient(endpoint_url="https://example.com", credentials=None)
            object_list = client.list_objects(bucket="my-bucket")
            if len(object_list) != expected_length:
                raise AssertionError(
                    f"Expected {expected_length} objects, but found {len(object_list)}"
                )
