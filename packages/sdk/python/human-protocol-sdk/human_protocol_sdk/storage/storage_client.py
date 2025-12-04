"""Client helpers for interacting with S3-compatible storage.

If credentials are not provided, anonymous access is used (for downloads).

Example:
    ```python
    from human_protocol_sdk.storage import Credentials, StorageClient

    credentials = Credentials(
        access_key="my-access-key",
        secret_key="my-secret-key",
    )

    storage_client = StorageClient(
        endpoint_url="s3.us-west-2.amazonaws.com",
        region="us-west-2",
        credentials=credentials,
    )
    ```
"""

import hashlib
import io
import json
import logging
import os
from typing import List, Optional
from warnings import warn

from minio import Minio

logging.getLogger("minio").setLevel(logging.INFO)

DEBUG = "true" in os.getenv("DEBUG", "false").lower()
LOG = logging.getLogger("human_protocol_sdk.storage")
LOG.setLevel(logging.DEBUG if DEBUG else logging.INFO)


warn(f"The module {__name__} is deprecated.", DeprecationWarning, stacklevel=2)


class StorageClientError(Exception):
    """Raised when an error happens while interacting with storage."""

    pass


class StorageFileNotFoundError(StorageClientError):
    """Raised when a file is not found by its key."""

    pass


class Credentials:
    """Credentials required to authenticate with an S3-compatible service."""

    def __init__(self, access_key: str, secret_key: str):
        """Create credentials.

        Args:
            access_key: Access key for the S3-compatible service.
            secret_key: Secret key for the S3-compatible service.
        """

        self.access_key = access_key
        self.secret_key = secret_key


class StorageClient:
    """Client for interacting with S3-compatible services."""

    def __init__(
        self,
        endpoint_url: str,
        region: Optional[str] = None,
        credentials: Optional[Credentials] = None,
        secure: Optional[bool] = True,
    ):
        """Create a storage client.

        If credentials are not provided, anonymous access is used.

        Args:
            endpoint_url: URL of the S3-compatible service.
            region: Region of the S3-compatible service.
            credentials: Credentials for authentication (optional for anonymous access).
            secure: Whether to use TLS to connect to the service.
        """
        try:
            self.client = (
                Minio(
                    region=region,
                    endpoint=endpoint_url,
                    secure=secure,
                )  # anonymous access
                if credentials is None
                else Minio(
                    access_key=credentials.access_key,
                    secret_key=credentials.secret_key,
                    region=region,
                    endpoint=endpoint_url,
                    secure=secure,
                )  # authenticated access
            )
            self.endpoint = endpoint_url
            self.secure = secure
        except Exception as e:
            LOG.error(f"Connection with S3 failed because of: {e}")
            raise e

    def download_files(self, files: List[str], bucket: str) -> List[bytes]:
        """Download files from the specified bucket.

        Args:
            files: List of file keys to download.
            bucket: Name of the S3-compatible bucket.

        Returns:
            List of file contents (bytes) from the bucket.

        Raises:
            StorageClientError: If an error occurs while downloading.
            StorageFileNotFoundError: If a file is not found in the bucket.

        Example:
            ```python
            from human_protocol_sdk.storage import Credentials, StorageClient

            credentials = Credentials(
                access_key="my-access-key",
                secret_key="my-secret-key",
            )

            storage_client = StorageClient(
                endpoint_url="s3.us-west-2.amazonaws.com",
                region="us-west-2",
                credentials=credentials,
            )

            result = storage_client.download_files(
                files=["file1.txt", "file2.txt"],
                bucket="my-bucket",
            )
            ```
        """
        result_files = []
        for file in files:
            try:
                response = self.client.get_object(bucket_name=bucket, object_name=file)
                result_files.append(response.read())
            except Exception as e:
                if hasattr(e, "code") and str(e.code) == "NoSuchKey":
                    raise StorageFileNotFoundError("No object found - returning empty")
                LOG.warning(
                    f"Reading the key {file} with S3 failed" f" because of: {str(e)}"
                )
                raise StorageClientError(str(e))
        return result_files

    def upload_files(self, files: List[dict], bucket: str) -> List[dict]:
        """Upload a list of files to the specified bucket.

        Args:
            files: List of file payloads to upload. Each item can be a dict with
                ``file`` (bytes/str), ``key``, and ``hash`` or an arbitrary object
                that will be JSON-serialized.
            bucket: Name of the S3-compatible bucket to upload to.

        Returns:
            List of dicts containing ``key``, ``url``, and ``hash`` fields.

        Raises:
            StorageClientError: If an error occurs while uploading the files.

        Example:
            ```python
            from human_protocol_sdk.storage import Credentials, StorageClient

            credentials = Credentials(
                access_key="my-access-key",
                secret_key="my-secret-key",
            )

            storage_client = StorageClient(
                endpoint_url="s3.us-west-2.amazonaws.com",
                region="us-west-2",
                credentials=credentials,
            )

            result = storage_client.upload_files(
                files=[{"file": b\"content\", "key": "file1.txt", "hash": "hash1"}],
                bucket="my-bucket",
            )
            ```
        """
        result_files = []
        for file in files:
            if "file" in file and "key" in file and "hash" in file:
                data = file["file"]
                hash = file["hash"]
                key = file["key"]
            else:
                try:
                    artifact = json.dumps(file, sort_keys=True)
                except Exception as e:
                    LOG.error("Can't extract the json from the object")
                    raise e
                data = artifact.encode("utf-8")
                hash = hashlib.sha1(data).hexdigest()
                key = f"s3{hash}.json"

            url = (
                f"{'https' if self.secure else 'http'}://{self.endpoint}/{bucket}/{key}"
            )
            file_exist = None

            try:
                # check if file with same hash already exists in bucket
                file_exist = self.client.stat_object(
                    bucket_name=bucket, object_name=key
                )
            except Exception as e:
                if hasattr(e, "code") and str(e.code) == "NoSuchKey":
                    # file does not exist in bucket, so upload it
                    pass
                else:
                    LOG.warning(
                        f"Reading the key {key} in S3 failed" f" because of: {str(e)}"
                    )
                    raise StorageClientError(str(e))

            if not file_exist:
                # file does not exist in bucket, so upload it
                try:
                    self.client.put_object(
                        bucket_name=bucket,
                        object_name=key,
                        data=io.BytesIO(data),
                        length=len(data),
                    )
                    LOG.debug(f"Uploaded to S3, key: {key}")
                except Exception as e:
                    raise StorageClientError(str(e))

            result_files.append({"key": key, "url": url, "hash": hash})

        return result_files

    def bucket_exists(self, bucket: str) -> bool:
        """Check if a given bucket exists.

        Args:
            bucket: The name of the bucket to check.

        Returns:
            True if the bucket exists, False otherwise.

        Raises:
            StorageClientError: If an error occurs while checking the bucket.
        """
        try:
            return self.client.bucket_exists(bucket_name=bucket)
        except Exception as e:
            LOG.warning(
                f"Checking the bucket {bucket} in S3 failed" f" because of: {str(e)}"
            )
            raise StorageClientError(str(e))

    def list_objects(self, bucket: str) -> List[str]:
        """Return a list of all objects in a given bucket.

        Args:
            bucket: The name of the bucket to list objects from.

        Returns:
            A list of object keys in the given bucket.

        Raises:
            StorageClientError: If an error occurs while listing the objects.
        """
        try:
            objects = list(self.client.list_objects(bucket_name=bucket))
            if objects:
                return [obj._object_name for obj in objects]
            else:
                return []
        except Exception as e:
            LOG.warning(f"Listing objects in S3 failed because of: {str(e)}")
            raise StorageClientError(str(e))
