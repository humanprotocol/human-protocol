import unittest
from unittest.mock import patch

from human_protocol_sdk.storage import (
    _connect_s3,
    get_bucket,
    get_public_bucket_url,
    get_key_from_url,
)

ESCROW_TEST_BUCKETNAME = "test-escrow-results"
ESCROW_TEST_PUBLIC_BUCKETNAME = "test-escrow-public-results"

ESCROW_RESULTS_AWS_S3_ACCESS_KEY_ID = "ESCROW_RESULTS_AWS_S3_ACCESS_KEY_ID"
ESCROW_RESULTS_AWS_S3_SECRET_ACCESS_KEY = "ESCROW_RESULTS_AWS_S3_SECRET_ACCESS_KEY"
ESCROW_AWS_ACCESS_KEY_ID = "ESCROW_AWS_ACCESS_KEY_ID"
ESCROW_AWS_SECRET_ACCESS_KEY = "ESCROW_AWS_SECRET_ACCESS_KEY"
ESCROW_PUBLIC_BUCKETNAME = "my-public-bucket"


class BucketTest(unittest.TestCase):
    """Bucket related tests"""

    @patch("human_protocol_sdk.storage.ESCROW_BUCKETNAME", ESCROW_TEST_BUCKETNAME)
    @patch(
        "human_protocol_sdk.storage.ESCROW_PUBLIC_BUCKETNAME",
        ESCROW_TEST_PUBLIC_BUCKETNAME,
    )
    def test_retrieving_bucket(self):
        """Tests whether internal bucket is retrieved public/private bucket."""
        bucket_name = get_bucket(public=False)
        self.assertEqual(bucket_name, ESCROW_TEST_BUCKETNAME)

        bucket_name = get_bucket(public=True)
        self.assertEqual(bucket_name, ESCROW_TEST_PUBLIC_BUCKETNAME)

    @patch(
        "human_protocol_sdk.storage.ESCROW_PUBLIC_BUCKETNAME", ESCROW_PUBLIC_BUCKETNAME
    )
    def test_public_bucket_url_retrieval(self):
        """Tests whether bucket public URL is retrieved correctly."""
        key = "s3aaa"
        expected_url = f"https://{ESCROW_PUBLIC_BUCKETNAME}.s3.amazonaws.com/{key}"

        url = get_public_bucket_url(key)
        self.assertEqual(url, expected_url)

    def test_key_retrieval_from_file_url(self):
        """Testes whether key can be retrieved from URL correctly."""
        expected_key = "s3aaa"

        # Qualified URL must be parsed and key retrieved
        url = f"https://{ESCROW_PUBLIC_BUCKETNAME}.s3.amazonaws.com/{expected_key}"
        key = get_key_from_url(url)
        self.assertEqual(key, expected_key)

        # Key passed as URL without qualification must return key
        key = get_key_from_url(key)
        self.assertEqual(key, expected_key)

    @patch(
        "human_protocol_sdk.storage.ESCROW_AWS_ACCESS_KEY_ID", ESCROW_AWS_ACCESS_KEY_ID
    )
    @patch(
        "human_protocol_sdk.storage.ESCROW_AWS_SECRET_ACCESS_KEY",
        ESCROW_AWS_SECRET_ACCESS_KEY,
    )
    @patch("human_protocol_sdk.storage.boto3")
    def test_connect_private_bucket_when_param_passed(self, boto3):
        """Tests connection to private bucket with False param."""

        _connect_s3(False)
        self.assertIn("endpoint_url", boto3.client.call_args.kwargs.keys())
        self.assertEqual(
            boto3.client.call_args.kwargs["aws_access_key_id"], ESCROW_AWS_ACCESS_KEY_ID
        )
        self.assertEqual(
            boto3.client.call_args.kwargs["aws_secret_access_key"],
            ESCROW_AWS_SECRET_ACCESS_KEY,
        )

    @patch(
        "human_protocol_sdk.storage.ESCROW_AWS_ACCESS_KEY_ID", ESCROW_AWS_ACCESS_KEY_ID
    )
    @patch(
        "human_protocol_sdk.storage.ESCROW_AWS_SECRET_ACCESS_KEY",
        ESCROW_AWS_SECRET_ACCESS_KEY,
    )
    @patch("human_protocol_sdk.storage.boto3")
    def test_connect_private_bucket_without_param(self, boto3):
        """Tests connection to private bucket without param."""

        _connect_s3(False)
        self.assertIn("endpoint_url", boto3.client.call_args.kwargs.keys())
        self.assertEqual(
            boto3.client.call_args.kwargs["aws_access_key_id"], ESCROW_AWS_ACCESS_KEY_ID
        )
        self.assertEqual(
            boto3.client.call_args.kwargs["aws_secret_access_key"],
            ESCROW_AWS_SECRET_ACCESS_KEY,
        )

    @patch(
        "human_protocol_sdk.storage.ESCROW_RESULTS_AWS_S3_ACCESS_KEY_ID",
        ESCROW_RESULTS_AWS_S3_ACCESS_KEY_ID,
    )
    @patch(
        "human_protocol_sdk.storage.ESCROW_RESULTS_AWS_S3_SECRET_ACCESS_KEY",
        ESCROW_RESULTS_AWS_S3_SECRET_ACCESS_KEY,
    )
    @patch("human_protocol_sdk.storage.boto3")
    def test_connect_public_bucket(self, boto3):
        """Tests connection to public bucket."""

        _connect_s3(True)
        self.assertNotIn("endpoint_url", boto3.client.call_args.kwargs.keys())
        self.assertEqual(
            boto3.client.call_args.kwargs["aws_access_key_id"],
            ESCROW_RESULTS_AWS_S3_ACCESS_KEY_ID,
        )
        self.assertEqual(
            boto3.client.call_args.kwargs["aws_secret_access_key"],
            ESCROW_RESULTS_AWS_S3_SECRET_ACCESS_KEY,
        )


if __name__ == "__main__":
    unittest.main(exit=True)
