from enum import Enum
from src.config import Config


class Networks(str, Enum):
    network_id = Config.network_config.network_id


class WebhookTypes(str, Enum):
    jl_webhook = "jl_webhook"
    recoracle_webhook = "recoracle_webhook"


class WebhookStatuses(str, Enum):
    pending = "pending"
    completed = "completed"
