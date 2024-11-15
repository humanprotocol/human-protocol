from enum import Enum

from src.core.config import Config
from src.utils.enums import BetterEnumMeta


class Networks(int, Enum, metaclass=BetterEnumMeta):
    polygon_mainnet = Config.polygon_mainnet.chain_id
    polygon_amoy = Config.polygon_amoy.chain_id
    localhost = Config.localhost.chain_id


class CvatEventTypes(str, Enum, metaclass=BetterEnumMeta):
    update_job = "update:job"
    create_job = "create:job"
    ping = "ping"


class ProjectStatuses(str, Enum, metaclass=BetterEnumMeta):
    creation = "creation"
    annotation = "annotation"
    completed = "completed"
    validation = "validation"
    canceled = "canceled"
    recorded = "recorded"
    deleted = "deleted"


class TaskStatuses(str, Enum, metaclass=BetterEnumMeta):
    annotation = "annotation"
    completed = "completed"


class JobStatuses(str, Enum, metaclass=BetterEnumMeta):
    new = "new"
    in_progress = "in progress"
    rejected = "rejected"
    completed = "completed"


class TaskTypes(str, Enum, metaclass=BetterEnumMeta):
    image_label_binary = "image_label_binary"
    image_points = "image_points"
    image_boxes = "image_boxes"
    image_boxes_from_points = "image_boxes_from_points"
    image_skeletons_from_boxes = "image_skeletons_from_boxes"
    image_polygons = "image_polygons"


class CvatLabelTypes(str, Enum, metaclass=BetterEnumMeta):
    tag = "tag"
    points = "points"
    rectangle = "rectangle"
    polygon = "polygon"


class OracleWebhookTypes(str, Enum, metaclass=BetterEnumMeta):
    exchange_oracle = "exchange_oracle"
    job_launcher = "job_launcher"
    recording_oracle = "recording_oracle"
    reputation_oracle = "reputation_oracle"


class ExchangeOracleEventTypes(str, Enum, metaclass=BetterEnumMeta):
    job_creation_failed = "job_creation_failed"
    job_finished = "job_finished"
    escrow_cleaned = "escrow_cleaned"


class JobLauncherEventTypes(str, Enum, metaclass=BetterEnumMeta):
    escrow_created = "escrow_created"
    escrow_canceled = "escrow_canceled"


class RecordingOracleEventTypes(str, Enum, metaclass=BetterEnumMeta):
    job_completed = "job_completed"
    submission_rejected = "submission_rejected"


class ReputationOracleEventTypes(str, Enum, metaclass=BetterEnumMeta):
    # TODO: rename to ReputationOracleEventType
    escrow_completed = "escrow_completed"


class OracleWebhookStatuses(str, Enum, metaclass=BetterEnumMeta):
    pending = "pending"
    completed = "completed"
    failed = "failed"


class AssignmentStatuses(str, Enum, metaclass=BetterEnumMeta):
    """
    State changes:

    - created: -> expired / completed / canceled
    - completed: -> rejected
    """

    created = "created"
    completed = "completed"
    expired = "expired"
    rejected = "rejected"
    canceled = "canceled"


class EscrowValidationStatuses(str, Enum, metaclass=BetterEnumMeta):
    awaiting = "awaiting"
    in_progress = "in_progress"
    completed = "completed"
