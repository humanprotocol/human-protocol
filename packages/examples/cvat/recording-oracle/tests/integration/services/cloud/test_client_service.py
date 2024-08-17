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
        client = S3Client(
            endpoint_url=self.url,
            bucket=self.bucket_name,
            access_key=self.access_key,
            secret_key=self.secret,
        )

        assert len(client.list_files()) == 0

        file_name = "test_file"
        data = b"this is a test"

        assert not client.file_exists(file_name)
        client.create_file(file_name, data)
        assert client.file_exists(file_name)
        assert len(client.list_files()) == 1

        file_content = client.download_file(key=file_name)
        assert file_content == data

        client.remove_file(file_name)
        assert not client.file_exists(file_name)

    def test_degenerate_file_operations(self):
        client = S3Client(endpoint_url=self.url, access_key=self.access_key, secret_key=self.secret)
        invalid_bucket = "non-existent-bucket"
        invalid_file = "non-existent-file"

        with pytest.raises(ClientError):
            client.download_file(invalid_file, bucket=invalid_bucket)

        with pytest.raises(ClientError):
            client.download_file(invalid_file, bucket=self.bucket_name)

        with pytest.raises(ClientError):
            client.create_file(invalid_file, bucket=invalid_bucket)

        with pytest.raises(ClientError):
            client.list_files(bucket=invalid_bucket)

        client.remove_file(invalid_file, bucket=self.bucket_name)

    def test_degenerate_client(self):
        with pytest.raises(EndpointConnectionError):
            invalid_client = S3Client(
                endpoint_url="http://not.an.url:1234",
                access_key=self.access_key,
                secret_key=self.secret,
            )
            invalid_client.create_file("test.txt", bucket=self.bucket_name)

        with pytest.raises(ValueError):
            S3Client(endpoint_url="nonsense-stuff")
