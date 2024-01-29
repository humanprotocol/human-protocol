from __future__ import annotations

from dataclasses import dataclass
from enum import Enum, auto
from typing import Optional

from src.utils.enums import BetterEnumMeta


class CloudProviders(Enum, metaclass=BetterEnumMeta):
    aws = auto()
    gcs = auto()


@dataclass
class BucketUrl:
    provider: CloudProviders
    host_url: str
    bucket_name: str
    path: str


class BucketCredentials:
    pass


@dataclass
class BucketAccessInfo:
    url: BucketUrl
    credentials: Optional[BucketCredentials] = None

    @classmethod
    def from_raw_url(cls, url: str) -> BucketAccessInfo:
        from src.services.cloud.utils import parse_bucket_url

        return cls.from_parsed_url(parse_bucket_url(url))

    @classmethod
    def from_parsed_url(cls, parsed_url: BucketUrl) -> BucketAccessInfo:
        return BucketAccessInfo(url=parsed_url)

    @property
    def provider(self) -> CloudProviders:
        return self.url.provider
