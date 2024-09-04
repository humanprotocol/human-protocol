from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field

from src.core.types import Networks, TaskTypes
from src.utils.enums import BetterEnumMeta, StrEnum

DEFAULT_TOKEN = "HMT"  # noqa: S105 (it's  not a credential)


class JobStatuses(StrEnum, metaclass=BetterEnumMeta):
    active = "ACTIVE"
    completed = "COMPLETED"
    canceled = "CANCELED"


class JobResponse(BaseModel):
    escrow_address: str
    chain_id: int  # not Networks, as existing DB entries can be different from the current enum
    job_type: TaskTypes
    status: JobStatuses
    job_description: str | None = None
    reward_amount: str | None = None
    reward_token: str | None = DEFAULT_TOKEN
    created_at: datetime | None = None
    qualifications: list[str] = Field(default_factory=list)


class UserResponse(BaseModel):
    wallet_address: str = Field(min_length=1)
    email: str = Field(min_length=1)


class AssignmentRequest(BaseModel):
    escrow_address: str
    chain_id: Networks


class AssignmentStatuses(str, Enum, metaclass=BetterEnumMeta):
    active = "ACTIVE"
    validation = "VALIDATION"
    completed = "COMPLETED"
    expired = "EXPIRED"
    canceled = "CANCELED"
    rejected = "REJECTED"


class AssignmentResponse(BaseModel):
    assignment_id: str
    escrow_address: str
    chain_id: int  # not Networks, as existing DB entries can be different from the current enum
    job_type: TaskTypes
    url: str | None
    status: AssignmentStatuses
    reward_amount: str | None = None
    reward_token: str | None = DEFAULT_TOKEN
    created_at: datetime
    updated_at: datetime
    expires_at: datetime


class UserStatsResponse(BaseModel):
    assignments_total: int
    submissions_sent: int
    assignments_completed: int
    assignments_rejected: int
    assignments_expired: int


class OracleStatsResponse(BaseModel):
    escrows_processed: int
    escrows_active: int
    escrows_cancelled: int
    workers_total: int
    assignments_completed: int
    assignments_rejected: int
    assignments_expired: int
