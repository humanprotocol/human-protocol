from abc import ABCMeta, abstractmethod
from urllib.parse import unquote


class StorageClient(metaclass=ABCMeta):
    def __init__(
        self,
        bucket: str | None = None,
    ) -> None:
        self._bucket = unquote(bucket) if bucket else None

    @abstractmethod
    def create_file(self, key: str, data: bytes = b"", *, bucket: str | None = None): ...

    @abstractmethod
    def remove_file(self, key: str, *, bucket: str | None = None): ...

    @abstractmethod
    def remove_files(self, prefix: str, *, bucket: str | None = None): ...

    @abstractmethod
    def file_exists(self, key: str, *, bucket: str | None = None) -> bool: ...

    @abstractmethod
    def download_file(self, key: str, *, bucket: str | None = None) -> bytes: ...

    @abstractmethod
    def list_files(self, *, bucket: str | None = None, prefix: str | None = None) -> list[str]: ...

    @staticmethod
    def normalize_prefix(prefix: str | None) -> str | None:
        return unquote(prefix).strip("/\\") + "/" if prefix else prefix
