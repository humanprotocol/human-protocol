from __future__ import annotations

from typing import TYPE_CHECKING
from urllib.parse import urljoin

from src.core.config import Config
from src.core.manifest import get_manifest_task_type
from src.core.tasks import TaskTypes, skeletons_from_boxes

if TYPE_CHECKING:
    from src.core.manifest import ManifestBase
    from src.models.cvat import Project


def compose_assignment_url(task_id: int, job_id: int, *, project: Project) -> str:
    query_params = ""
    if project.job_type in [
        TaskTypes.image_skeletons_from_boxes,
        TaskTypes.image_boxes_from_points,
        TaskTypes.image_points,
        TaskTypes.image_polygons,
    ]:
        query_params = "?defaultWorkspace=single_shape"

    if project.job_type == TaskTypes.image_skeletons_from_boxes:
        query_params += "&defaultPointsCount=1"

    return urljoin(Config.cvat_config.host_url, f"/tasks/{task_id}/jobs/{job_id}{query_params}")


def get_default_assignment_timeout(task_type: TaskTypes) -> int:
    timeout_seconds = Config.core_config.default_assignment_time

    if task_type == TaskTypes.image_skeletons_from_boxes:
        timeout_seconds *= skeletons_from_boxes.DEFAULT_ASSIGNMENT_SIZE_MULTIPLIER

    return timeout_seconds


def get_assignment_timeout(manifest: ManifestBase) -> int:
    """
    Get assignment expiration timeout, in seconds.
    """
    details = getattr(getattr(manifest, "annotation", None), "details", None)
    max_time = getattr(details, "max_time", None)
    if max_time is not None:
        return max_time

    return get_default_assignment_timeout(get_manifest_task_type(manifest))
