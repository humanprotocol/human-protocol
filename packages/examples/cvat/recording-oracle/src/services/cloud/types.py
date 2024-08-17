from __future__ import annotations

import json
from dataclasses import asdict, dataclass, is_dataclass
from enum import Enum, auto
from inspect import isclass
from urllib.parse import urlparse

from src.core import manifest
from src.core.config import Config, IStorageConfig
from src.services.cloud.gcs import DEFAULT_GCS_HOST
from src.services.cloud.s3 import DEFAULT_S3_HOST
from src.utils.enums import BetterEnumMeta
from src.utils.net import is_ipv4


class CloudProviders(Enum, metaclass=BetterEnumMeta):
    aws = auto()
    gcs = auto()

    @classmethod
    def from_str(cls, provider: str) -> CloudProviders:
        try:
            return cls[provider.lower()]
        except KeyError:
            raise ValueError(
                f"The '{provider}' is not supported. "
                f"List with supported providers: {', '.join(x.name for x in cls)}"
            )


class BucketCredentials:
    def to_dict(self) -> dict:
        if not is_dataclass(self):
            raise NotImplementedError

        return asdict(self)

    @classmethod
    def from_storage_config(cls, config: type[IStorageConfig]) -> BucketCredentials | None:
        credentials = None

        if (config.access_key or config.secret_key) and config.provider.lower() != "aws":
            raise ValueError(
                "Invalid storage configuration. The access_key/secret_key pair"
                f"cannot be specified with {config.provider} provider"
            )
        elif (
            bool(config.access_key) ^ bool(config.secret_key)
        ) and config.provider.lower() == "aws":
            raise ValueError(
                "Invalid storage configuration. "
                "Either none or both access_key and secret_key must be specified for an AWS storage"
            )

        if config.key_file_path and config.provider.lower() != "gcs":
            raise ValueError(
                "Invalid storage configuration. The key_file_path"
                f"cannot be specified with {config.provider} provider"
            )

        if config.access_key and config.secret_key:
            credentials = S3BucketCredentials(config.access_key, config.secret_key)
        elif config.key_file_path:
            with open(config.key_file_path, "rb") as f:
                credentials = GcsBucketCredentials(json.load(f))

        return credentials


@dataclass
class GcsBucketCredentials(BucketCredentials):
    service_account_key: dict


@dataclass
class S3BucketCredentials(BucketCredentials):
    access_key: str
    secret_key: str


@dataclass
class BucketAccessInfo:
    provider: CloudProviders
    host_url: str
    bucket_name: str
    path: str | None = None
    credentials: BucketCredentials | None = None

    @classmethod
    def from_url(cls, url: str) -> BucketAccessInfo:
        parsed_url = urlparse(url)

        if parsed_url.netloc.endswith(DEFAULT_S3_HOST):
            # AWS S3 bucket
            return BucketAccessInfo(
                provider=CloudProviders.aws,
                host_url=f"https://{DEFAULT_S3_HOST}",
                bucket_name=parsed_url.netloc.split(".")[0],
                path=parsed_url.path.lstrip("/"),
            )
        elif parsed_url.netloc.endswith(DEFAULT_GCS_HOST):
            # Google Cloud Storage (GCS) bucket
            # Virtual hosted-style is expected:
            # https://BUCKET_NAME.storage.googleapis.com/OBJECT_NAME
            return BucketAccessInfo(
                provider=CloudProviders.gcs,
                bucket_name=parsed_url.netloc[: -len(f".{DEFAULT_GCS_HOST}")],
                host_url=f"{parsed_url.scheme}://{DEFAULT_GCS_HOST}",
                path=parsed_url.path.lstrip("/"),
            )
        elif Config.features.enable_custom_cloud_host:
            if is_ipv4(parsed_url.netloc):
                host = parsed_url.netloc
                bucket_name, path = parsed_url.path.lstrip("/").split("/", maxsplit=1)
            else:
                host = parsed_url.netloc.partition(".")[2]
                bucket_name = parsed_url.netloc.split(".")[0]
                path = parsed_url.path.lstrip("/")

            return BucketAccessInfo(
                provider=CloudProviders.aws,
                host_url=f"{parsed_url.scheme}://{host}",
                bucket_name=bucket_name,
                path=path,
            )
        else:
            raise ValueError(f"{parsed_url.netloc} cloud provider is not supported.")

    @classmethod
    def _from_dict(cls, data: dict) -> BucketAccessInfo:
        for required_field in (
            "provider",
            "bucket_name",
        ):
            if required_field not in data:
                raise ValueError(
                    f"The {required_field} is required and is not "
                    "specified in the bucket configuration"
                )

        provider = CloudProviders.from_str(data["provider"])
        data["provider"] = provider

        if provider == CloudProviders.aws:
            access_key = data.pop("access_key", None)
            secret_key = data.pop("secret_key", None)
            if bool(access_key) ^ bool(secret_key):
                raise ValueError("access_key and secret_key can only be used together")

            data["credentials"] = S3BucketCredentials(access_key, secret_key)

        elif provider == CloudProviders.gcs and (
            service_account_key := data.pop("service_account_key", None)
        ):
            data["credentials"] = GcsBucketCredentials(service_account_key)

        return BucketAccessInfo(**data)

    @classmethod
    def from_storage_config(cls, config: type[IStorageConfig]) -> BucketAccessInfo:
        credentials = BucketCredentials.from_storage_config(config)

        return BucketAccessInfo(
            provider=CloudProviders.from_str(config.provider),
            host_url=config.provider_endpoint_url(),
            bucket_name=config.data_bucket_name,
            credentials=credentials,
        )

    @classmethod
    def from_bucket_url(cls, bucket_url: manifest.BucketUrl) -> BucketAccessInfo:
        return cls._from_dict(bucket_url.dict())

    @classmethod
    def parse_obj(cls, data: str | type[IStorageConfig] | manifest.BucketUrl) -> BucketAccessInfo:
        if isinstance(data, manifest.BucketUrlBase):
            return cls.from_bucket_url(data)
        elif isinstance(data, str):
            return cls.from_url(data)
        elif isclass(data) and issubclass(data, IStorageConfig):
            return cls.from_storage_config(data)

        raise TypeError(f"Unsupported data type ({type(data)}) was provided")
