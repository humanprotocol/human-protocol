import hashlib
import json
from typing import Optional

import boto3
from botocore import UNSIGNED
from botocore.client import Config
from botocore.exceptions import ClientError

from human_protocol_sdk import crypto


class StorageClientError(Exception):
    """Raises when some error happens when interacting with storage."""

    pass


class StorageFileNotFoundError(StorageClientError):
    """Raises when some error happens when file is not found by its key."""

    pass


class Credentials:
    access_key: str
    secret_key: str
    region: Optional[str]
    endpoint: Optional[str]


class StorageClient:
    def __init__(self, credentials: Optional[Credentials] = None):
        self._boto3_client = (
            boto3.client("s3", config=Config(signature_version=UNSIGNED))
            if credentials is None
            else boto3.client(
                "s3",
                aws_access_key_id=credentials.access_key,
                aws_secret_access_key=credentials.secret_key,
                region_name=credentials.region,
                endpoint_url=credentials.endpoint,
            )
        )

    def download_files(self, files: list[str], bucket: str) -> list:
        """Downloads data from storage if exists.

        Args:
            files(list[str]): File keys to find it in storage to be downloaded.
            bucket(str): Bucket where the data must be stored.
        """
        result_files = []
        for file in files:
            try:
                response = self._boto3_client.get_object(Bucket=bucket, Key=file)
                result_files.push(response["Body"].read())
            except ClientError as e:
                if e.response["Error"]["Code"] == "NoSuchKey":
                    raise StorageFileNotFoundError("No object found - returning empty")
                raise StorageClientError(str(e))
            except Exception as e:
                raise e
            else:
                return result_files

    def upload_files(self, files: list[object], bucket: str) -> list[str]:
        """Upload a string for later retrieval.
        This can be manifest files, results, or anything that's been already
        encrypted.

        Args:
            files(list): files to store.
            bucket(str): Bucket where data should be stored

        Returns:
            files(list[str]): Returns a list of file keys

        Raises:
            Exception: if adding bytes fails.

        """
        result_files = []
        for file in files:
            try:
                artifact = json.dumps(file, sort_keys=True)
            except Exception as e:
                raise e

            data = artifact.encode("utf-8")

            hash_ = hashlib.sha1(data).hexdigest()
            key = f"s3{hash_}"

            self._boto3_client.upload_fileobj(data, bucket, key)
            result_files.push(key)
        return result_files

    def bucket_exists(self, bucket: str) -> bool:
        """Checks if a bucket exists.

        Args:
            bucket(str): Bucket name to check.

        Returns:
            isExists(bool): Returns true if bucket exists, false otherwise
        """
        try:
            self._boto3_client.head_bucket(Bucket=bucket)
            return True
        except ClientError as e:
            return False
        except Exception as e:
            raise e

    def list_objects(self, bucket: str) -> list[str]:
        """Lists all objects in a bucket.

        Args:
            bucket(str): Bucket name to list.

        Returns:
            filenames(list[str]): Returns a list of filenames with their extensions in the bucket.
        """
        try:
            objs = self._boto3_client.list_objects_v2(Bucket=bucket)
            ["Contents"]
            return map(lambda obj: obj["Key"], objs)
        except Exception as e:
            raise e


def get_s3_instance(credentials: Optional[Credentials] = None) -> StorageClient:
    return StorageClient(credentials)
