from enum import Enum

from src.core.config import Config
from src.utils.enums import BetterEnumMeta


class Networks(int, Enum):
    polygon_mainnet = Config.polygon_mainnet.chain_id
    polygon_mumbai = Config.polygon_mumbai.chain_id
    localhost = Config.localhost.chain_id


class TaskType(str, Enum, metaclass=BetterEnumMeta):
    image_label_binary = "IMAGE_LABEL_BINARY"
    image_points = "IMAGE_POINTS"
    image_boxes = "IMAGE_BOXES"


class OracleWebhookTypes(str, Enum):
    exchange_oracle = "exchange_oracle"
    recording_oracle = "recording_oracle"
    reputation_oracle = "reputation_oracle"


class OracleWebhookStatuses(str, Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"


class ExchangeOracleEventType(str, Enum, metaclass=BetterEnumMeta):
    task_creation_failed = "task_creation_failed"
    task_finished = "task_finished"


class RecordingOracleEventType(str, Enum, metaclass=BetterEnumMeta):
    task_completed = "task_completed"
    task_rejected = "task_rejected"


class CloudProviders(str, Enum, metaclass=BetterEnumMeta):
    aws = "AWS_S3_BUCKET"
    gcs = "GOOGLE_CLOUD_STORAGE"
