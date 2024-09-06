from io import BytesIO
from urllib.parse import unquote

from google.cloud import storage

from src.services.cloud.client import StorageClient

DEFAULT_GCS_HOST = "storage.googleapis.com"


class GcsClient(StorageClient):
    def __init__(
        self,
        *,
        bucket: str | None = None,
        service_account_key: dict | None = None,
    ) -> None:
        super().__init__(bucket)

        if service_account_key:
            self.client = storage.Client.from_service_account_info(service_account_key)
        else:
            self.client = storage.Client.create_anonymous_client()

    def create_file(self, key: str, data: bytes = b"", *, bucket: str | None = None) -> None:
        bucket = unquote(bucket) if bucket else self._bucket
        bucket_client = self.client.get_bucket(bucket)
        bucket_client.blob(unquote(key)).upload_from_string(data)

    def remove_file(self, key: str, *, bucket: str | None = None) -> None:
        bucket = unquote(bucket) if bucket else self._bucket
        bucket_client = self.client.get_bucket(bucket)
        bucket_client.delete_blob(unquote(key))

    def remove_files(self, prefix: str, *, bucket: str | None = None):
        import warnings

        warnings.warn(
            "Avoid usage of `GcsClient.remove_files`. See: "
            "https://cloud.google.com/storage/docs/deleting-objects#delete-objects-in-bulk",
            UserWarning,
            stacklevel=2,
        )
        bucket = unquote(bucket) if bucket else self._bucket
        bucket_client = self.client.get_bucket(bucket)
        keys = self.list_files(prefix=prefix)
        bucket_client.delete_blobs([unquote(key) for key in keys])

    def file_exists(self, key: str, *, bucket: str | None = None) -> bool:
        bucket = unquote(bucket) if bucket else self._bucket
        bucket_client = self.client.get_bucket(bucket)
        return bucket_client.blob(unquote(key)).exists()

    def download_file(self, key: str, *, bucket: str | None = None) -> bytes:
        bucket = unquote(bucket) if bucket else self._bucket
        bucket_client = self.client.get_bucket(bucket)
        blob = bucket_client.blob(unquote(key))

        with BytesIO() as data:
            self.client.download_blob_to_file(blob, data)
            return data.getvalue()

    def list_files(self, *, bucket: str | None = None, prefix: str | None = None) -> list[str]:
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
