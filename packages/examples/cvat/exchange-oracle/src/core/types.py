from enum import IntEnum

from src.core.config import Config
from src.utils.enums import BetterEnumMeta, StrEnum


class Networks(IntEnum, metaclass=BetterEnumMeta):
    polygon_mainnet = Config.polygon_mainnet.chain_id
    polygon_amoy = Config.polygon_amoy.chain_id
    localhost = Config.localhost.chain_id


class ProjectStatuses(StrEnum, metaclass=BetterEnumMeta):
    creation = "creation"
    annotation = "annotation"
    completed = "completed"
    validation = "validation"
    canceled = "canceled"
    recorded = "recorded"
    deleted = "deleted"


class TaskStatuses(StrEnum, metaclass=BetterEnumMeta):
    annotation = "annotation"
    completed = "completed"


class JobStatuses(StrEnum, metaclass=BetterEnumMeta):
    new = "new"
    in_progress = "in progress"
    completed = "completed"


class OracleWebhookTypes(StrEnum, metaclass=BetterEnumMeta):
    exchange_oracle = "exchange_oracle"
    job_launcher = "job_launcher"
    recording_oracle = "recording_oracle"
    reputation_oracle = "reputation_oracle"


class ExchangeOracleEventTypes(StrEnum, metaclass=BetterEnumMeta):
    escrow_failed = "escrow_failed"
    job_finished = "job_finished"
    escrow_cleaned = "escrow_cleaned"
    escrow_recorded = "escrow_recorded"


class JobLauncherEventTypes(StrEnum, metaclass=BetterEnumMeta):
    escrow_created = "escrow_created"
    escrow_canceled = "escrow_canceled"


class RecordingOracleEventTypes(StrEnum, metaclass=BetterEnumMeta):
    job_completed = "job_completed"
    submission_rejected = "submission_rejected"


class ReputationOracleEventTypes(StrEnum, metaclass=BetterEnumMeta):
    escrow_completed = "escrow_completed"


class OracleWebhookStatuses(StrEnum, metaclass=BetterEnumMeta):
    pending = "pending"
    completed = "completed"
    failed = "failed"


class CvatWebhookStatuses(StrEnum, metaclass=BetterEnumMeta):
    pending = "pending"
    completed = "completed"
    failed = "failed"


class AssignmentStatuses(StrEnum, metaclass=BetterEnumMeta):
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


class EscrowValidationStatuses(StrEnum, metaclass=BetterEnumMeta):
    awaiting = "awaiting"
    in_progress = "in_progress"
    completed = "completed"
