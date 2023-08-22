from enum import Enum
from src.core.config import Config


class Networks(int, Enum):
    polygon_mainnet = Config.polygon_mainnet.chain_id
    polygon_mumbai = Config.polygon_mumbai.chain_id
    localhost = Config.localhost.chain_id


class JobTypes(str, Enum):
    image_label_binary = "IMAGE_LABEL_BINARY"


class OracleWebhookTypes(str, Enum):
    exchange_oracle = "exchange_oracle"
    reputation_oracle = "reputation_oracle"


class OracleWebhookStatuses(str, Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"
