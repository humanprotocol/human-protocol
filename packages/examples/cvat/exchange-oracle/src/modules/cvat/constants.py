from enum import Enum


class EventTypes(str, Enum):
    create_task = "create:task"
    update_job = "update:job"


class TaskStatuses(str, Enum):
    annotation = "annotation"
    completed = "completed"


class JobStatuses(str, Enum):
    new = "new"
    in_progress = "in_progress"
    completed = "completed"
