from enum import Enum


class OracleWebhookTypes(str, Enum):
    exchange_oracle = "exchange_oracle"
    reputation_oracle = "reputation_oracle"


class OracleWebhookStatuses(str, Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"
