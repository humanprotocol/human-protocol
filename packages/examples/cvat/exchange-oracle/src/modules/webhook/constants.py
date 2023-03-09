from enum import Enum
from src.config import Config


class Networks(str, Enum):
    polygon_mainnet = Config.polygon_mainnet.network_id
    polygon_mumbai = Config.polygon_mumbai.network_id


class WebhookTypes(str, Enum):
    jl_webhook = "jl_webhook"
    recoracle_webhook = "recoracle_webhook"


class WebhookStatuses(str, Enum):
    pending = "pending"
    completed = "completed"
