from enum import Enum


class WebhookTypes(str, Enum):
    exchange_oracle_webhook = "exchange_oracle_webhook"


class WebhookStatuses(str, Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"
