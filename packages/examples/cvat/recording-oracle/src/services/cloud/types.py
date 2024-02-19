from __future__ import annotations

import json
from dataclasses import dataclass
from enum import Enum, auto
from typing import Dict, Optional, Type, Union
from urllib.parse import urlparse

from src.core.config import Config, IStorageConfig
from src.services.cloud.s3 import DEFAULT_S3_HOST
from src.utils.enums import BetterEnumMeta
from src.utils.net import is_ipv4


class CloudProvider(Enum, metaclass=BetterEnumMeta):
    aws = auto()
    gcs = auto()

    @classmethod
    def list(cls):
        return [x.value for x in cls]

    @classmethod
    def from_str(cls, provider: str) -> CloudProvider:
        match provider:
            case "aws":
                return CloudProvider.aws
            case "gcs":
                return CloudProvider.gcs
            case _:
                raise ValueError(
                    f"The '{provider}' is not supported provider. List with supported providers: {cls.list()}"
                )


class BucketCredentials:
    def to_dict(self) -> Dict:
        return self.__dict__

    def from_storage_config(
        config: Type[IStorageConfig],
    ) -> Optional[BucketCredentials]:
        credentials = None

        if config.access_key and config.secret_key and config.provider != "aws":
            raise ValueError(
                "Wrong storage configuration. The access_key/secret_key pair"
                f"cannot be specified with {config.provider} provider"
            )

        if config.key_file_path and config.provider != "gcs":
            raise ValueError(
                "Wrong storage configuration. The key_file_path"
                f"cannot be specified with {config.provider} provider"
            )

        if config.access_key and config.secret_key:
            credentials = S3BucketCredentials(config.access_key, config.secret_key)
        elif config.key_file_path:
            with open(config.key_file_path, "rb") as f:
                credentials = GCSCredentials(json.load(f))

        return credentials


@dataclass
class GCSCredentials(BucketCredentials):
    service_account_key: Dict


@dataclass
class S3BucketCredentials(BucketCredentials):
    access_key: str
    secret_key: str


@dataclass
class BucketAccessInfo:
    provider: CloudProvider
    host_url: str
    bucket_name: str
    path: Optional[str] = None
    credentials: Optional[BucketCredentials] = None

    @classmethod
    def from_url(cls, data: str) -> BucketAccessInfo:
        parsed_url = urlparse(data)

        if parsed_url.netloc.endswith(DEFAULT_S3_HOST):
            # AWS S3 bucket
            return BucketAccessInfo(
                provider=CloudProvider.aws,
                host_url=f"https://{DEFAULT_S3_HOST}",
                bucket_name=parsed_url.netloc.split(".")[0],
                path=parsed_url.path.lstrip("/"),
            )
        elif parsed_url.netloc.endswith("storage.googleapis.com"):
            # TODO
            # Google Cloud Storage (GCS) bucket
            bucket_name, path = parsed_url.path.lstrip("/").split("/", maxsplit=1)
            return BucketAccessInfo(
                provider=CloudProvider.gcs,
                bucket_name=bucket_name,
                host_url=f"{parsed_url.scheme}://{parsed_url.netloc}",
                path=path,
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
                provider=CloudProvider.aws,
                host_url=f"{parsed_url.scheme}://{host}",
                bucket_name=bucket_name,
                path=path,
            )
        else:
            raise ValueError(
                f"{parsed_url.netloc} cloud provider is not supported by CVAT"
            )

    @classmethod
    def from_dict(cls, data: Dict) -> BucketAccessInfo:
        for required_field in (
            "provider",
            "bucket_name",
        ):
            if required_field not in data:
                raise ValueError(
                    f"The {required_field} is required and is not specified in the bucket configuration"
                )

        data["provider"] = CloudProvider.from_str(data["provider"].lower())

        if (access_key := data.pop("access_key", None)) and (
            secret_key := data.pop("secret_key", None)
        ):
            data["credentials"] = S3BucketCredentials(access_key, secret_key)

        elif service_account_key := data.pop("service_account_key", None):
            data["credentials"] = GCSCredentials(service_account_key)

        return BucketAccessInfo(**data)

    @classmethod
    def from_storage_config(cls, config: Type[IStorageConfig]) -> BucketAccessInfo:
        credentials = BucketCredentials.from_storage_config(config)

        return BucketAccessInfo(
            provider=CloudProvider.from_str(config.provider),
            host_url=config.provider_endpoint_url(),
            bucket_name=config.data_bucket_name,
            credentials=credentials,
        )

    @classmethod
    def parse_obj(
        cls, data: Union[Dict, str, Type[IStorageConfig]]
    ) -> BucketAccessInfo:
        if isinstance(data, Dict):
            return cls.from_dict(data)
        elif isinstance(data, str):
            return cls.from_url(data)
        elif issubclass(data, IStorageConfig):
            return cls.from_storage_config(data)

        raise TypeError(f"Unsupported data type ({type(data)}) was provided")
