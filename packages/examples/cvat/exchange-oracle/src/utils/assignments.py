from urllib.parse import urljoin

from src.core.config import Config
from src.core.manifest import TaskManifest
from src.core.types import Networks


def parse_manifest(manifest: dict) -> TaskManifest:
    return TaskManifest.parse_obj(manifest)


def compose_assignment_url(task_id, job_id) -> str:
    return urljoin(Config.cvat_config.cvat_url, f"/tasks/{task_id}/jobs/{job_id}")


def compose_output_annotation_filename(
    escrow_address: str, chain_id: Networks, filename: str
) -> str:
    return f"{escrow_address}@{chain_id}/{filename}"
