from abc import ABCMeta, abstractmethod
from typing import List, Optional


class StorageClient(metaclass=ABCMeta):
    @abstractmethod
    def create_file(self, bucket: str, filename: str, data: bytes = b""):
        ...

    @abstractmethod
    def remove_file(self, bucket: str, filename: str):
        ...

    @abstractmethod
    def file_exists(self, bucket: str, filename: str) -> bool:
        ...

    @abstractmethod
    def download_file(self, bucket: str, key: str) -> bytes:
        ...

    @abstractmethod
    def list_filenames(self, bucket: str, *, prefix: Optional[str] = None) -> List[str]:
        ...
