from typing import Protocol, runtime_checkable


@runtime_checkable
class ManifestBase(Protocol):
    version: int
