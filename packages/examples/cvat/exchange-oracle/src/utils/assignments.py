from urllib.parse import urljoin

from src.core.config import Config
from src.core.manifest import TaskManifest, TaskTypes
from src.core.manifest import parse_manifest as _parse_manifest
from src.core.tasks import skeletons_from_boxes
from src.models.cvat import Project


def parse_manifest(manifest: dict) -> TaskManifest:
    return _parse_manifest(manifest)


def compose_assignment_url(task_id: int, job_id: int, *, project: Project) -> str:
    query_params = ""
    if project.job_type in [
        TaskTypes.image_skeletons_from_boxes,
        TaskTypes.image_boxes_from_points,
    ]:
        query_params = "?defaultWorkspace=single_shape"

    return urljoin(Config.cvat_config.cvat_url, f"/tasks/{task_id}/jobs/{job_id}{query_params}")


def get_default_assignment_timeout(task_type: TaskTypes) -> int:
    timeout_seconds = Config.core_config.default_assignment_time

    if task_type == TaskTypes.image_skeletons_from_boxes:
        timeout_seconds *= skeletons_from_boxes.DEFAULT_ASSIGNMENT_SIZE_MULTIPLIER

    return timeout_seconds
