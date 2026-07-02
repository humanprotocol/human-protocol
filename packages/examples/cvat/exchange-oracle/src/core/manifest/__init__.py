from typing import Any

from src.core.manifest import v1, v2
from src.core.manifest.base import ManifestBase

__all__ = [
    "ManifestBase",
    "parse_manifest",
    "v1",
    "v2",
]


def parse_manifest(manifest: Any) -> ManifestBase:
    if isinstance(manifest, dict):
        version = manifest.get("version")
    else:
        version = getattr(manifest, "version", None)

    if version == 2:
        return v2.JobManifest.model_validate(manifest)
    else:
        return v1.JobManifest.model_validate(manifest)
