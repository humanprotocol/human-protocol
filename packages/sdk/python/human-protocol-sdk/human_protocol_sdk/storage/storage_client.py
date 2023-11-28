"""
This client enables to interact with S3 cloud storage services like Amazon S3 Bucket,
Google Cloud Storage and others.

If credentials are not provided, anonymous access will be used (for downloading files).

Code Example
------------

.. code-block:: python

    from human_protocol_sdk.storage import (
        Credentials,
        StorageClient,
    )

    credentials = Credentials(
        access_key="my-access-key",
        secret_key="my-secret-key",
    )

    storage_client = StorageClient(
        endpoint_url="s3.us-west-2.amazonaws.com",
        region="us-west-2",
        credentials=credentials,
    )

Module
------
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
    """
    Raises when some error happens when interacting with storage.
    """

    pass


class StorageFileNotFoundError(StorageClientError):
    """
    Raises when some error happens when file is not found by its key.
    """

    pass


class Credentials:
    """
    A class to represent the credentials required to authenticate with an S3-compatible service.

    Example::

        credentials = Credentials(
            access_key='my-access-key',
            secret_key='my-secret-key'
        )

    """

    def __init__(self, access_key: str, secret_key: str):
        """
        Initializes a Credentials instance.

        :param access_key: The access key for the S3-compatible service.
        :param secret_key: The secret key for the S3-compatible service.
        """

        self.access_key = access_key
        self.secret_key = secret_key


class StorageClient:
    """
    A class for downloading files from an S3-compatible service.

    :attribute:
        - client (Minio): The S3-compatible client used for interacting with the service.

    :example:
        .. code-block:: python

            # Download a list of files from an S3-compatible service
            client = StorageClient(
                endpoint_url='https://s3.us-west-2.amazonaws.com',
                region='us-west-2',
                credentials=Credentials(
                    access_key='my-access-key',
                    secret_key='my-secret-key'
                )
            )
            files = ['file1.txt', 'file2.txt']
            bucket = 'my-bucket'
            result_files = client.download_files(files=files, bucket=bucket)

    """

    def __init__(
        self,
        endpoint_url: str,
        region: Optional[str] = None,
        credentials: Optional[Credentials] = None,
        secure: Optional[bool] = True,
    ):
        """
        Initializes the StorageClient with the given endpoint_url, region, and credentials.

        If credentials are not provided, anonymous access will be used.

        :param endpoint_url: The URL of the S3-compatible service.
        :param region: The region of the S3-compatible service. Defaults to None.
        :param credentials: The credentials required to authenticate with the S3-compatible service.
            Defaults to None for anonymous access.
        :param secure: Flag to indicate to use secure (TLS) connection to S3 service or not.
            Defaults to True.
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
        """
        Downloads a list of files from the specified S3-compatible bucket.

        :param files: A list of file keys to download.
        :param bucket: The name of the S3-compatible bucket to download from.

        :return: A list of file contents (bytes) downloaded from the bucket.

        :raise StorageClientError: If an error occurs while downloading the files.
        :raise StorageFileNotFoundError: If one of the specified files is not found in the bucket.

        :example:
            .. code-block:: python

                from human_protocol_sdk.storage import (
                    Credentials,
                    StorageClient,
                )

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
                    files = ["file1.txt", "file2.txt"],
                    bucket = "my-bucket"
                )
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
        """
        Uploads a list of files to the specified S3-compatible bucket.

        :param files: A list of files to upload.
        :param bucket: The name of the S3-compatible bucket to upload to.

        :return: List of dict with key, url, hash fields

        :raise StorageClientError: If an error occurs while uploading the files.

        :example:
            .. code-block:: python

                from human_protocol_sdk.storage import (
                    Credentials,
                    StorageClient,
                )

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
                    files = ["file content"],
                    bucket = "my-bucket"
                )
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
        """
        Check if a given bucket exists.

        :param bucket: The name of the bucket to check.

        :return: True if the bucket exists, False otherwise.

        :raise StorageClientError: If an error occurs while checking the bucket.

        :example:
            .. code-block:: python

                from human_protocol_sdk.storage import (
                    Credentials,
                    StorageClient,
                )

                credentials = Credentials(
                    access_key="my-access-key",
                    secret_key="my-secret-key",
                )

                storage_client = StorageClient(
                    endpoint_url="s3.us-west-2.amazonaws.com",
                    region="us-west-2",
                    credentials=credentials,
                )

                is_exists = storage_client.bucket_exists(
                    bucket = "my-bucket"
                )
        """
        try:
            return self.client.bucket_exists(bucket_name=bucket)
        except Exception as e:
            LOG.warning(
                f"Checking the bucket {bucket} in S3 failed" f" because of: {str(e)}"
            )
            raise StorageClientError(str(e))

    def list_objects(self, bucket: str) -> List[str]:
        """
        Return a list of all objects in a given bucket.

        :param bucket: The name of the bucket to list objects from.

        :return: A list of object keys in the given bucket.

        :raise StorageClientError: If an error occurs while listing the objects.

        :example:
            .. code-block:: python

                from human_protocol_sdk.storage import (
                    Credentials,
                    StorageClient,
                )

                credentials = Credentials(
                    access_key="my-access-key",
                    secret_key="my-secret-key",
                )

                storage_client = StorageClient(
                    endpoint_url="s3.us-west-2.amazonaws.com",
                    region="us-west-2",
                    credentials=credentials,
                )

                result = storage_client.list_objects(
                    bucket = "my-bucket"
                )
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
