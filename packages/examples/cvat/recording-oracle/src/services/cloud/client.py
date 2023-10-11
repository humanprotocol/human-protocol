# Copyright (C) 2022 CVAT.ai Corporation
#
# SPDX-License-Identifier: MIT

from io import BytesIO
from typing import List, Optional

import boto3
from botocore.exceptions import ClientError
from botocore.handlers import disable_signing


class S3Client:
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
            endpoint_url=endpoint_url,
        )

        self.resource = s3
        self.client = s3.meta.client

        if not access_key and not secret_key:
            self.client.meta.events.register("choose-signer.s3.*", disable_signing)

    def create_file(self, bucket: str, filename: str, data: bytes = b""):
        self.client.put_object(Body=data, Bucket=bucket, Key=filename)

    def remove_file(self, bucket: str, filename: str):
        self.client.delete_object(Bucket=bucket, Key=filename)

    def file_exists(self, bucket: str, filename: str) -> bool:
        try:
            self.client.head_object(Bucket=bucket, Key=filename)
            return True
        except ClientError as e:
            if e.response["Error"]["Code"] == "404":
                return False
            else:
                raise

    def download_fileobj(self, bucket: str, key: str) -> bytes:
        with BytesIO() as data:
            self.client.download_fileobj(Bucket=bucket, Key=key, Fileobj=data)
            return data.getvalue()

    def list_files(self, bucket: str, path: Optional[str] = None) -> List:
        objects = self.resource.Bucket(bucket).objects
        if path:
            objects = objects.filter(Prefix=path.strip("/\\") + "/")
        else:
            objects = objects.all()
        return list(objects)
