from urllib.parse import urljoin

from src.core.config import Config
from src.core.manifest import TaskManifest, TaskType
from src.core.manifest import parse_manifest as _parse_manifest
from src.models.cvat import Project


def parse_manifest(manifest: dict) -> TaskManifest:
    return _parse_manifest(manifest)


def compose_assignment_url(task_id: int, job_id: int, *, project: Project) -> str:
    query_params = ""
    if project.job_type in [TaskType.image_skeletons_from_boxes, TaskType.image_boxes_from_points]:
        query_params = "?defaultWorkspace=single_shape"

    return urljoin(Config.cvat_config.cvat_url, f"/tasks/{task_id}/jobs/{job_id}{query_params}")
