from enum import Enum


class OracleWebhookTypes(str, Enum):
    job_launcher = "job_launcher"
    recording_oracle = "recoring_oracle"


class OracleWebhookStatuses(str, Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"
