from enum import Enum

from src.core.config import Config
from src.utils.enums import BetterEnumMeta


class Networks(int, Enum):
    polygon_mainnet = Config.polygon_mainnet.chain_id
    polygon_amoy = Config.polygon_amoy.chain_id
    localhost = Config.localhost.chain_id


class TaskTypes(str, Enum, metaclass=BetterEnumMeta):
    image_label_binary = "image_label_binary"
    image_points = "image_points"
    image_polygons = "image_polygons"
    image_boxes = "image_boxes"
    image_boxes_from_points = "image_boxes_from_points"
    image_skeletons_from_boxes = "image_skeletons_from_boxes"
    audio_transcription = "audio_transcription"


class OracleWebhookTypes(str, Enum):
    exchange_oracle = "exchange_oracle"
    recording_oracle = "recording_oracle"
    reputation_oracle = "reputation_oracle"


class OracleWebhookStatuses(str, Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"


class ExchangeOracleEventTypes(str, Enum, metaclass=BetterEnumMeta):
    job_creation_failed = "job_creation_failed"
    job_finished = "job_finished"
    escrow_cleaned = "escrow_cleaned"


class RecordingOracleEventTypes(str, Enum, metaclass=BetterEnumMeta):
    job_completed = "job_completed"
    submission_rejected = "submission_rejected"
