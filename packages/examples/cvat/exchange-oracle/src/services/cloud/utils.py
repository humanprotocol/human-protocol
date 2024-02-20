from typing import Optional, Union, overload
from urllib.parse import urlparse

from src.core.config import Config
from src.services.cloud.client import StorageClient
from src.services.cloud.s3 import DEFAULT_S3_HOST, S3Client
from src.services.cloud.types import BucketAccessInfo, BucketCredentials, BucketUrl, CloudProviders
from src.utils.net import is_ipv4


def parse_bucket_url(data_url: str) -> BucketUrl:
    parsed_url = urlparse(data_url)

    if parsed_url.netloc.endswith(DEFAULT_S3_HOST):
        # AWS S3 bucket
        return BucketUrl(
            provider=CloudProviders.aws,
            host_url=f"https://{DEFAULT_S3_HOST}",
            bucket_name=parsed_url.netloc.split(".")[0],
            path=parsed_url.path.lstrip("/"),
        )
    # elif parsed_url.netloc.endswith("storage.googleapis.com"):
    #     # Google Cloud Storage (GCS) bucket
    #     return ParsedBucketUrl(
    #         provider=CloudProviders.gcs,
    #         bucket_name=parsed_url.netloc.split(".")[0],
    #     )
    elif Config.features.enable_custom_cloud_host:
        if is_ipv4(parsed_url.netloc):
            host = parsed_url.netloc
            bucket_name, path = parsed_url.path.lstrip("/").split("/", maxsplit=1)
        else:
            host = parsed_url.netloc.partition(".")[2]
            bucket_name = parsed_url.netloc.split(".")[0]
            path = parsed_url.path.lstrip("/")

        return BucketUrl(
            provider=CloudProviders.aws,
            host_url=f"{parsed_url.scheme}://{host}",
            bucket_name=bucket_name,
            path=path,
        )
    else:
        raise ValueError(f"{parsed_url.netloc} cloud provider is not supported by CVAT")


def compose_bucket_url(
    bucket_name: str, provider: CloudProviders, *, bucket_host: Optional[str] = None
) -> str:
    match provider:
        case CloudProviders.aws:
            return f"https://{bucket_name}.{bucket_host or 's3.amazonaws.com'}/"
        case CloudProviders.gcs:
            return f"https://{bucket_name}.{bucket_host or 'storage.googleapis.com'}/"


@overload
def make_client(url: BucketUrl, credentials: Optional[BucketCredentials] = None) -> StorageClient:
    ...


@overload
def make_client(
    bucket_info: BucketAccessInfo,
) -> StorageClient:
    ...


def make_client(
    _pos1: Union[BucketUrl, BucketAccessInfo, None] = None,
    *,
    bucket_info: Optional[BucketAccessInfo] = None,
    url: Optional[BucketUrl] = None,
    credentials: Optional[BucketCredentials] = None,
) -> StorageClient:
    if _pos1 is not None:
        if isinstance(_pos1, BucketAccessInfo):
            bucket_info = _pos1
        else:
            url = _pos1

    if bucket_info is None:
        bucket_info = BucketAccessInfo(url=url, credentials=credentials)

    match bucket_info.provider:
        case CloudProviders.aws:
            client_kwargs = {}
            if bucket_info.credentials:
                client_kwargs["access_key"] = bucket_info.credentials.access_key
                client_kwargs["secret_key"] = bucket_info.credentials.secret_key

            client = S3Client(bucket_info.url.host_url, **client_kwargs)
        case _:
            raise Exception("Unsupported cloud provider")

    return client
