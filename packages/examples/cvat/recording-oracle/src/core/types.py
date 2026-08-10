from enum import IntEnum

from src.core.config import Config
from src.utils.enums import BetterEnumMeta, StrEnum


class Networks(IntEnum):
    polygon_mainnet = Config.polygon_mainnet.chain_id
    polygon_amoy = Config.polygon_amoy.chain_id
    localhost = Config.localhost.chain_id


class OracleWebhookTypes(StrEnum, metaclass=BetterEnumMeta):
    exchange_oracle = "exchange_oracle"
    recording_oracle = "recording_oracle"
    reputation_oracle = "reputation_oracle"


class OracleWebhookStatuses(StrEnum, metaclass=BetterEnumMeta):
    pending = "pending"
    completed = "completed"
    failed = "failed"


class ExchangeOracleEventTypes(StrEnum, metaclass=BetterEnumMeta):
    escrow_failed = "escrow_failed"
    job_finished = "job_finished"
    escrow_cleaned = "escrow_cleaned"
    escrow_recorded = "escrow_recorded"


class RecordingOracleEventTypes(StrEnum, metaclass=BetterEnumMeta):
    job_completed = "job_completed"
    submission_rejected = "submission_rejected"
