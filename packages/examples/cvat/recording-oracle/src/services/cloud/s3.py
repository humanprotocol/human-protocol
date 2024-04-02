from io import BytesIO
from typing import List, Optional
from urllib.parse import unquote

import boto3
from botocore.exceptions import ClientError
from botocore.handlers import disable_signing

from src.services.cloud.client import StorageClient

DEFAULT_S3_HOST = "s3.amazonaws.com"


class S3Client(StorageClient):
    def __init__(
        self,
        *,
        bucket: Optional[str] = None,
        access_key: Optional[str] = None,
        secret_key: Optional[str] = None,
        endpoint_url: Optional[str] = None,
    ) -> None:
        super().__init__(bucket)
        session = boto3.Session(
            **(dict(aws_access_key_id=access_key) if access_key else {}),
            **(dict(aws_secret_access_key=secret_key) if secret_key else {}),
        )
        s3 = session.resource(
            "s3", **({"endpoint_url": unquote(endpoint_url)} if endpoint_url else {})
        )
        self.resource = s3
        self.client = s3.meta.client

        if not access_key and not secret_key:
            self.client.meta.events.register("choose-signer.s3.*", disable_signing)

    def create_file(self, key: str, data: bytes = b"", *, bucket: Optional[str] = None):
        bucket = unquote(bucket) if bucket else self._bucket
        self.client.put_object(Body=data, Bucket=bucket, Key=unquote(key))

    def remove_file(self, key: str, *, bucket: Optional[str] = None):
        bucket = unquote(bucket) if bucket else self._bucket
        self.client.delete_object(Bucket=bucket, Key=unquote(key))

    def file_exists(self, key: str, *, bucket: Optional[str] = None) -> bool:
        bucket = unquote(bucket) if bucket else self._bucket
        try:
            self.client.head_object(Bucket=bucket, Key=unquote(key))
            return True
        except ClientError as e:
            if e.response["Error"]["Code"] == "404":
                return False
            else:
                raise

    def download_file(self, key: str, *, bucket: Optional[str] = None) -> bytes:
        bucket = unquote(bucket) if bucket else self._bucket
        with BytesIO() as data:
            self.client.download_fileobj(Bucket=bucket, Key=unquote(key), Fileobj=data)
            return data.getvalue()

    def list_files(
        self, *, bucket: Optional[str] = None, prefix: Optional[str] = None
    ) -> List[str]:
        bucket = unquote(bucket) if bucket else self._bucket
        objects = self.resource.Bucket(bucket).objects
        if prefix:
            objects = objects.filter(Prefix=self.normalize_prefix(prefix))
        else:
            objects = objects.all()
        return [file_info.key for file_info in objects]
