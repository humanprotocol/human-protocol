from enum import Enum


class WebhookTypes(str, Enum):
    jl_webhook = "jl_webhook"
    recoracle_webhook = "recoracle_webhook"


class WebhookStatuses(str, Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"
