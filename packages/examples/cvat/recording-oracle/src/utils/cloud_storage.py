from dataclasses import dataclass
from typing import Optional
from urllib.parse import urlparse

from src.core.config import Config
from src.core.types import CloudProviders
from src.utils.net import is_ipv4


@dataclass
class ParsedBucketUrl:
    provider: str
    host_url: str
    bucket_name: str
    path: str


DEFAULT_S3_HOST = "s3.amazonaws.com"


def parse_bucket_url(data_url: str) -> ParsedBucketUrl:
    parsed_url = urlparse(data_url)

    if parsed_url.netloc.endswith(DEFAULT_S3_HOST):
        # AWS S3 bucket
        return ParsedBucketUrl(
            provider=CloudProviders.aws.value,
            host_url=f"https://{DEFAULT_S3_HOST}",
            bucket_name=parsed_url.netloc.split(".")[0],
            path=parsed_url.path.lstrip("/"),
        )
    # elif parsed_url.netloc.endswith("storage.googleapis.com"):
    #     # Google Cloud Storage (GCS) bucket
    #     return ParsedBucketUrl(
    #         provider=CloudProviders.gcs.value,
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

        return ParsedBucketUrl(
            provider=CloudProviders.aws.value,
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
        case CloudProviders.aws.value:
            return f"https://{bucket_name}.{bucket_host or 's3.amazonaws.com'}/"
        case CloudProviders.gcs.value:
            return f"https://{bucket_name}.{bucket_host or 'storage.googleapis.com'}/"
