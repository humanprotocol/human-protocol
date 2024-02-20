import unittest

import boto3
import pytest
from botocore.exceptions import ClientError, EndpointConnectionError

from src.services.cloud.s3 import S3Client


class ServiceIntegrationTest(unittest.TestCase):
    def setUp(self):
        self.url = "http://minio:9000"
        self.bucket_name = "test-bucket"
        self.access_key = "dev"
        self.secret = "devdevdev"
        self.client = boto3.resource(
            "s3",
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret,
            endpoint_url=self.url,
        ).meta.client
        self.client.create_bucket(Bucket=self.bucket_name)

    def tearDown(self):
        self.client.delete_bucket(Bucket=self.bucket_name)

    def test_file_operations(self):
        client = S3Client(self.url, access_key=self.access_key, secret_key=self.secret)

        assert len(client.list_files(self.bucket_name)) == 0

        file_name = "test_file"
        data = "this is a test".encode("utf-8")

        assert not client.file_exists(self.bucket_name, file_name)
        client.create_file(self.bucket_name, file_name, data)
        assert client.file_exists(self.bucket_name, file_name)
        assert len(client.list_files(self.bucket_name)) == 1

        file_content = client.download_file(bucket=self.bucket_name, key=file_name)
        assert file_content == data

        client.remove_file(self.bucket_name, file_name)
        assert not client.file_exists(self.bucket_name, file_name)

    def test_degenerate_file_operations(self):
        client = S3Client(self.url, access_key=self.access_key, secret_key=self.secret)
        invalid_bucket = "non-existent-bucket"
        invalid_file = "non-existent-file"

        with pytest.raises(ClientError):
            client.download_file(bucket=invalid_bucket, key=invalid_file)

        with pytest.raises(ClientError):
            client.download_file(bucket=self.bucket_name, key=invalid_file)

        with pytest.raises(ClientError):
            client.create_file(bucket=invalid_bucket, filename=invalid_file)

        with pytest.raises(ClientError):
            client.list_files(bucket=invalid_bucket)

        client.remove_file(bucket=self.bucket_name, filename=invalid_file)

    def test_degenerate_client(self):
        with pytest.raises(EndpointConnectionError):
            invalid_client = S3Client(
                "http://not.an.url:1234", access_key=self.access_key, secret_key=self.secret
            )
            invalid_client.create_file(self.bucket_name, "test.txt")

        with pytest.raises(ValueError):
            S3Client("nonsense-stuff")
