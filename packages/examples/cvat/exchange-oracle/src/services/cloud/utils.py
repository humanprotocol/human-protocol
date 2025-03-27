from src.services.cloud.client import StorageClient
from src.services.cloud.gcs import GcsClient
from src.services.cloud.s3 import S3Client
from src.services.cloud.types import BucketAccessInfo, CloudProviders


def make_client(
    bucket_info: BucketAccessInfo,
) -> StorageClient:
    client_kwargs = {
        "bucket": bucket_info.bucket_name,
    }

    match bucket_info.provider:
        case CloudProviders.aws:
            client_type = S3Client

            if bucket_info.credentials:
                client_kwargs["access_key"] = bucket_info.credentials.access_key
                client_kwargs["secret_key"] = bucket_info.credentials.secret_key

            if bucket_info.host_url:
                client_kwargs["endpoint_url"] = bucket_info.host_url
        case CloudProviders.gcs:
            client_type = GcsClient

            if bucket_info.credentials:
                client_kwargs["service_account_key"] = bucket_info.credentials.service_account_key
        case _:
            raise ValueError(f"Unsupported cloud provider ({bucket_info.provider}) was provided")

    return client_type(**client_kwargs)
