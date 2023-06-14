from enum import Enum


class EventTypes(str, Enum):
    update_job = "update:job"
    create_job = "create:job"


class TaskStatuses(str, Enum):
    annotation = "annotation"
    completed = "completed"


class JobStatuses(str, Enum):
    new = "new"
    in_progress = "in_progress"
    completed = "completed"
