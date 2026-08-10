from __future__ import annotations

from typing import TYPE_CHECKING, Any

from src.core.manifest import v1, v2
from src.core.manifest.base import ManifestBase

if TYPE_CHECKING:
    from src.core.tasks import TaskTypes

__all__ = [
    "ManifestBase",
    "get_manifest_task_type",
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


def get_manifest_task_type(manifest: ManifestBase) -> TaskTypes:
    if isinstance(manifest, v1.JobManifest):
        return manifest.annotation.type
    if isinstance(manifest, v2.JobManifest):
        return manifest.job_type

    raise NotImplementedError(f"Unknown manifest version '{manifest.version}'")
