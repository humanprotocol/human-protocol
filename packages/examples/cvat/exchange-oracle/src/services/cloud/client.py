from abc import ABCMeta, abstractmethod
from typing import Optional
from urllib.parse import unquote


class StorageClient(metaclass=ABCMeta):
    def __init__(
        self,
        bucket: Optional[str] = None,
    ) -> None:
        self._bucket = unquote(bucket) if bucket else None

    @abstractmethod
    def create_file(self, key: str, data: bytes = b"", *, bucket: Optional[str] = None): ...

    @abstractmethod
    def remove_file(self, key: str, *, bucket: Optional[str] = None): ...

    @abstractmethod
    def file_exists(self, key: str, *, bucket: Optional[str] = None) -> bool: ...

    @abstractmethod
    def download_file(self, key: str, *, bucket: Optional[str] = None) -> bytes: ...

    @abstractmethod
    def list_files(
        self, *, bucket: Optional[str] = None, prefix: Optional[str] = None
    ) -> list[str]: ...

    @staticmethod
    def normalize_prefix(prefix: Optional[str]) -> Optional[str]:
        return unquote(prefix).strip("/\\") + "/" if prefix else prefix
