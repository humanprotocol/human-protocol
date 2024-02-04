from typing import Optional

from src.services.cloud.client import StorageClient
from src.services.cloud.gcs import GCSClient
from src.services.cloud.s3 import S3Client
from src.services.cloud.types import BucketAccessInfo, CloudProvider


def compose_bucket_url(
    bucket_name: str, provider: CloudProvider, *, bucket_host: Optional[str] = None
) -> str:
    match provider:
        case CloudProvider.aws:
            return f"https://{bucket_name}.{bucket_host or 's3.amazonaws.com'}/"
        case CloudProvider.gcs:
            return f"https://{bucket_name}.{bucket_host or 'storage.googleapis.com'}/"


def make_client(
    bucket_info: BucketAccessInfo,
) -> StorageClient:
    client_kwargs = {
        "bucket": bucket_info.bucket_name,
    }

    match bucket_info.provider:
        case CloudProvider.aws:
            client_kwargs = {}
            if bucket_info.credentials:
                client_kwargs["access_key"] = bucket_info.credentials.access_key
                client_kwargs["secret_key"] = bucket_info.credentials.secret_key

            client = S3Client(bucket_info.host_url, **client_kwargs)
        case CloudProvider.gcs:
            if bucket_info.credentials:
                client_kwargs["service_account_json"] = bucket_info.credentials.service_account_key

            client = GCSClient(**client_kwargs)
        case _:
            raise Exception("Unsupported cloud provider")

    return client
