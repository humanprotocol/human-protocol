from io import BytesIO
from typing import TYPE_CHECKING
from urllib.parse import unquote

import boto3
from botocore.exceptions import ClientError
from botocore.handlers import disable_signing

from src.services.cloud.client import StorageClient

DEFAULT_S3_HOST = "s3.amazonaws.com"
if TYPE_CHECKING:
    from mypy_boto3_s3 import S3Client as S3ClientStub
    from mypy_boto3_s3 import S3ServiceResource as S3ServiceResourceStub


class S3Client(StorageClient):
    def __init__(
        self,
        *,
        bucket: str | None = None,
        access_key: str | None = None,
        secret_key: str | None = None,
        endpoint_url: str | None = None,
    ) -> None:
        super().__init__(bucket)
        session = boto3.Session(
            **({"aws_access_key_id": access_key} if access_key else {}),
            **({"aws_secret_access_key": secret_key} if secret_key else {}),
        )
        s3 = session.resource(
            "s3", **({"endpoint_url": unquote(endpoint_url)} if endpoint_url else {})
        )
        self.resource: S3ServiceResourceStub = s3

        self.client: S3ClientStub = s3.meta.client

        if not access_key and not secret_key:
            self.client.meta.events.register("choose-signer.s3.*", disable_signing)

    def create_file(self, key: str, data: bytes = b"", *, bucket: str | None = None):
        bucket = unquote(bucket) if bucket else self._bucket
        self.client.put_object(Body=data, Bucket=bucket, Key=unquote(key))

    def remove_file(self, key: str, *, bucket: str | None = None):
        bucket = unquote(bucket) if bucket else self._bucket
        self.client.delete_object(Bucket=bucket, Key=unquote(key))

    def remove_files(self, prefix: str, *, bucket: str | None = None):
        bucket = unquote(bucket) if bucket else self._bucket
        self.resource.Bucket(bucket).objects.filter(Prefix=unquote(prefix)).delete()

    def file_exists(self, key: str, *, bucket: str | None = None) -> bool:
        bucket = unquote(bucket) if bucket else self._bucket
        try:
            self.client.head_object(Bucket=bucket, Key=unquote(key))
            return True
        except ClientError as e:
            if e.response["Error"]["Code"] == "404":
                return False
            else:
                raise

    def download_file(self, key: str, *, bucket: str | None = None) -> bytes:
        bucket = unquote(bucket) if bucket else self._bucket
        with BytesIO() as data:
            self.client.download_fileobj(Bucket=bucket, Key=unquote(key), Fileobj=data)
            return data.getvalue()

    def list_files(
        self, *, bucket: str | None = None, prefix: str | None = None, trim_prefix: bool = False
    ) -> list[str]:
        bucket = unquote(bucket) if bucket else self._bucket
        objects = self.resource.Bucket(bucket).objects

        if trim_prefix:
            assert prefix, "The trim_prefix option cannot be used without a prefix"

        if prefix:
            prefix = self.normalize_prefix(prefix)
            objects = objects.filter(Prefix=prefix)

            if trim_prefix:
                return [file_info.key[len(prefix) :].strip("/") for file_info in objects]

        return [file_info.key for file_info in objects.all()]
