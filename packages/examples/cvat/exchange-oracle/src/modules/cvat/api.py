from fastapi import APIRouter

from .api_schema import CvatWebhook
from .constants import EventTypes
from .handlers import handle_task_event, handle_job_event


router = APIRouter()


@router.post(
    "/cvat",
    description="Consumes a webhook from a cvat",
)
def cvat_webhook(cvat_webhook: CvatWebhook):
    match cvat_webhook.event:
        case EventTypes.create_task.value:
            handle_task_event(cvat_webhook.task)
        case EventTypes.update_job.value:
            handle_job_event(cvat_webhook)
