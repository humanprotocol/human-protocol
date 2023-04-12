import hashlib
import io
import json
import os
import logging
from typing import Optional, List

from minio import Minio

logging.getLogger("boto").setLevel(logging.INFO)
logging.getLogger("botocore").setLevel(logging.INFO)
logging.getLogger("boto3").setLevel(logging.INFO)

DEBUG = "true" in os.getenv("DEBUG", "false").lower()
LOG = logging.getLogger("human_protocol_sdk.storage")
LOG.setLevel(logging.DEBUG if DEBUG else logging.INFO)


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

    Args:
        access_key (str): The access key for the S3-compatible service.
        secret_key (str): The secret key for the S3-compatible service.

    Attributes:
        access_key (str): The access key for the S3-compatible service.
        secret_key (str): The secret key for the S3-compatible service.

    Example:
        credentials = Credentials(
            access_key='my-access-key',
            secret_key='my-secret-key'
        )
    """

    def __init__(self, access_key: str, secret_key: str):
        self.access_key = access_key
        self.secret_key = secret_key


class StorageClient:
    """
    A class for downloading files from an S3-compatible service.

    Args:
        endpoint_url (str): The URL of the S3-compatible service.
        region (Optional[str]): The region of the S3-compatible service. Defaults to None.
        credentials (Optional[Credentials]): The credentials required to authenticate with the S3-compatible service.
                                             Defaults to None for anonymous access.

    Attributes:
        client (boto3.client): The S3-compatible client used for interacting with the service.

    Example:
        # Download a list of files from an S3-compatible service
        client = StorageClient(endpoint_url='https://s3.us-west-2.amazonaws.com',
                               region='us-west-2',
                               credentials=Credentials(access_key='my-access-key', secret_key='my-secret-key'))
        files = ['file1.txt', 'file2.txt']
        bucket = 'my-bucket'
        result_files = client.download_files(files=files, bucket=bucket)
    """

    def __init__(
        self,
        endpoint_url: str,
        region: Optional[str] = None,
        credentials: Optional[Credentials] = None,
    ):
        """
        Initializes the StorageClient with the given endpoint_url, region, and credentials.

        If credentials are not provided, anonymous access will be used.

        Args:
            endpoint_url (str): The URL of the S3-compatible service.
            region (Optional[str]): The region of the S3-compatible service. Defaults to None.
            credentials (Optional[Credentials]): The credentials required to authenticate with the S3-compatible service.
                                                 Defaults to None for anonymous access.
        """
        try:
            self.client = (
                Minio(
                    region=region,
                    endpoint=endpoint_url,
                )  # anonymous access
                if credentials is None
                else Minio(
                    access_key=credentials.access_key,
                    secret_key=credentials.secret_key,
                    region=region,
                    endpoint=endpoint_url,
                    secure=False,
                )  # authenticated access
            )
        except Exception as e:
            LOG.error(f"Connection with S3 failed because of: {e}")
            raise e

    def download_files(self, files: List[str], bucket: str) -> List:
        """
        Downloads a list of files from the specified S3-compatible bucket.

        Args:
            files (list[str]): A list of file keys to download.
            bucket (str): The name of the S3-compatible bucket to download from.

        Returns:
            list: A list of file contents (bytes) downloaded from the bucket.

        Raises:
            StorageClientError: If an error occurs while downloading the files.
            StorageFileNotFoundError: If one of the specified files is not found in the bucket.
        """
        result_files = []
        for file in files:
            try:
                response = self.client.get_object(Bucket=bucket, Key=file)
                result_files.append(response["Body"].read())
            except ClientError as e:
                if e.response["Error"]["Code"] == "NoSuchKey":
                    raise StorageFileNotFoundError("No object found - returning empty")
                raise StorageClientError(str(e))
            except Exception as e:
                LOG.warning(
                    f"Reading the key {file} with S3 failed" f" because of: {str(e)}"
                )
                raise StorageClientError(str(e))
        return result_files

    def upload_files(self, files: List[object], bucket: str) -> List[str]:
        """
        Uploads a list of files to the specified S3-compatible bucket.

        Args:
            files (list[object]): A list of files to upload.
            bucket (str): The name of the S3-compatible bucket to upload to.

        Returns:
            list: A list of keys assigned to the uploaded files.

        Raises:
            StorageClientError: If an error occurs while uploading the files.
        """
        result_files = []
        for file in files:
            try:
                artifact = json.dumps(file, sort_keys=True)
            except Exception as e:
                LOG.error("Can't extract the json from the object")
                raise e

            data = artifact.encode("utf-8")
            hash_ = hashlib.sha1(data).hexdigest()
            key = f"s3{hash_}"
            etag = None

            try:
                # check if file with same hash already exists in bucket
                response = self.client.head_object(Bucket=bucket, Key=key)
                etag = response["ETag"].strip('"')
                result_files.append(key)
            except ClientError as e:
                if e.response["Error"]["Code"] == "404":
                    # file does not exist in bucket, so upload it
                    pass
                else:
                    raise StorageClientError(str(e))
            except Exception as e:
                LOG.warning(
                    f"Reading the key {key} in S3 failed" f" because of: {str(e)}"
                )
                raise StorageClientError(str(e))

            if etag is None:
                # file does not exist in bucket, so upload it
                try:
                    self.client.upload_fileobj(io.BytesIO(data), bucket, key)
                    result_files.append(key)
                    LOG.debug(f"Uploaded to S3, key: {key}")
                except ClientError as e:
                    raise StorageClientError(str(e))

        return result_files

    def bucket_exists(self, bucket: str) -> bool:
        """
        Check if a given bucket exists.

        Args:
            bucket (str): The name of the bucket to check.

        Returns:
            bool: True if the bucket exists, False otherwise.

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
        """
        Return a list of all objects in a given bucket.

        Args:
            bucket (str): The name of the bucket to list objects from.

        Returns:
            List[str]: A list of object keys in the given bucket.

        Raises:
            StorageClientError: If an error occurs while listing the objects.
        """
        try:
            objects = list(self.client.list_objects(bucket_name=bucket))
            if objects:
                return [obj["_object_name"] for obj in objects]
            else:
                return []
        except Exception as e:
            LOG.warning(f"Listing objects in S3 failed because of: {str(e)}")
            raise StorageClientError(str(e))
