# Copyright (C) 2022 CVAT.ai Corporation
#
# SPDX-License-Identifier: MIT

from dataclasses import dataclass
from io import BytesIO
from typing import List, Optional
from urllib.parse import unquote

import boto3
from botocore.exceptions import ClientError
from botocore.handlers import disable_signing

from src.services.cloud.client import StorageClient
from src.services.cloud.types import BucketCredentials


class S3Client(StorageClient):
    def __init__(
        self,
        endpoint_url: str,
        *,
        access_key: Optional[str] = None,
        secret_key: Optional[str] = None,
    ) -> None:
        s3 = boto3.resource(
            "s3",
            **(dict(aws_access_key_id=access_key) if access_key else {}),
            **(dict(aws_secret_access_key=secret_key) if secret_key else {}),
            endpoint_url=unquote(endpoint_url),
        )

        self.resource = s3
        self.client = s3.meta.client

        if not access_key and not secret_key:
            self.client.meta.events.register("choose-signer.s3.*", disable_signing)

    def create_file(self, bucket: str, filename: str, data: bytes = b""):
        self.client.put_object(Body=data, Bucket=unquote(bucket), Key=unquote(filename))

    def remove_file(self, bucket: str, filename: str):
        self.client.delete_object(Bucket=unquote(bucket), Key=unquote(filename))

    def file_exists(self, bucket: str, filename: str) -> bool:
        try:
            self.client.head_object(Bucket=unquote(bucket), Key=unquote(filename))
            return True
        except ClientError as e:
            if e.response["Error"]["Code"] == "404":
                return False
            else:
                raise

    def download_file(self, bucket: str, key: str) -> bytes:
        with BytesIO() as data:
            self.client.download_fileobj(Bucket=unquote(bucket), Key=unquote(key), Fileobj=data)
            return data.getvalue()

    def list_files(self, bucket: str, *, prefix: Optional[str] = None) -> List:
        objects = self.resource.Bucket(unquote(bucket)).objects
        if prefix:
            objects = objects.filter(Prefix=unquote(prefix).strip("/\\") + "/")
        else:
            objects = objects.all()
        return list(objects)

    def list_filenames(self, bucket: str, *, prefix: Optional[str] = None) -> List[str]:
        return [file_info.key for file_info in self.list_files(bucket=bucket, prefix=prefix)]


@dataclass
class S3BucketCredentials(BucketCredentials):
    access_key: str
    secret_key: str


DEFAULT_S3_HOST = "s3.amazonaws.com"


def download_file(bucket_host: str, bucket_name: str, filename: str) -> bytes:
    client = S3Client(bucket_host)
    return client.download_file(bucket_name, filename)


def list_files(bucket_host: str, bucket_name: str, *, prefix: Optional[str] = None) -> List[str]:
    client = S3Client(bucket_host)
    return client.list_filenames(bucket_name, prefix=prefix)
