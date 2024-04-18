from io import BytesIO
from typing import Dict, List, Optional
from urllib.parse import unquote

from google.cloud import storage

from src.services.cloud.client import StorageClient

DEFAULT_GCS_HOST = "storage.googleapis.com"


class GcsClient(StorageClient):
    def __init__(
        self,
        *,
        bucket: Optional[str] = None,
        service_account_key: Optional[Dict] = None,
    ) -> None:
        super().__init__(bucket)

        if service_account_key:
            self.client = storage.Client.from_service_account_info(service_account_key)
        else:
            self.client = storage.Client.create_anonymous_client()

    def create_file(self, key: str, data: bytes = b"", *, bucket: Optional[str] = None) -> None:
        bucket = unquote(bucket) if bucket else self._bucket
        bucket_client = self.client.get_bucket(bucket)
        bucket_client.blob(unquote(key)).upload_from_string(data)

    def remove_file(self, key: str, *, bucket: Optional[str] = None) -> None:
        bucket = unquote(bucket) if bucket else self._bucket
        bucket_client = self.client.get_bucket(bucket)
        bucket_client.delete_blob(unquote(key))

    def file_exists(self, key: str, *, bucket: Optional[str] = None) -> bool:
        bucket = unquote(bucket) if bucket else self._bucket
        bucket_client = self.client.get_bucket(bucket)
        return bucket_client.blob(unquote(key)).exists()

    def download_file(self, key: str, *, bucket: Optional[str] = None) -> bytes:
        bucket = unquote(bucket) if bucket else self._bucket
        bucket_client = self.client.get_bucket(bucket)
        blob = bucket_client.blob(unquote(key))

        with BytesIO() as data:
            self.client.download_blob_to_file(blob, data)
            return data.getvalue()

    def list_files(
        self, *, bucket: Optional[str] = None, prefix: Optional[str] = None
    ) -> List[str]:
        bucket = unquote(bucket) if bucket else self._bucket
        prefix = self.normalize_prefix(prefix)

        return [
            blob.name
            for blob in self.client.list_blobs(
                bucket_or_name=bucket,
                fields="items(name)",
                **(
                    {
                        "prefix": prefix,
                        "delimiter": "/",
                    }
                    if prefix
                    else {}
                ),
            )
        ]
