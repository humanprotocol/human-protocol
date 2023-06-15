from enum import Enum


class EventTypes(str, Enum):
    update_job = "update:job"
    create_job = "create:job"


class ProjectStatuses(str, Enum):
    annotation = "annotation"
    completed = "completed"
    recorded = "recorded"


class TaskStatuses(str, Enum):
    annotation = "annotation"
    completed = "completed"


class JobStatuses(str, Enum):
    new = "new"
    in_progress = "in_progress"
    completed = "completed"


class JobTypes(str, Enum):
    image_label_binary = "IMAGE_LABEL_BINARY"


class CvatLabelTypes(str, Enum):
    tag = "tag"


class Providers(str, Enum):
    aws = "AWS_S3_BUCKET"
    gcs = "GOOGLE_CLOUD_STORAGE"
