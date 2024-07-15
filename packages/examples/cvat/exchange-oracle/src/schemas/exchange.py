from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field

from src.core.types import Networks, TaskTypes
from src.utils.enums import BetterEnumMeta, StrEnum

DEFAULT_TOKEN = "HMT"


class JobStatuses(StrEnum, metaclass=BetterEnumMeta):
    active = "ACTIVE"
    completed = "COMPLETED"
    canceled = "CANCELED"


class JobResponse(BaseModel):
    escrow_address: str
    chain_id: int  # not Networks, as existing DB entries can be different from the current enum
    job_type: TaskTypes
    status: JobStatuses
    job_description: Optional[str] = None
    reward_amount: Optional[str] = None
    reward_token: Optional[str] = DEFAULT_TOKEN
    created_at: Optional[datetime] = None
    qualifications: list[str] = Field(default_factory=list)


class UserResponse(BaseModel):
    wallet_address: str = Field(min_length=1)
    cvat_email: str = Field(min_length=1)


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
    url: Optional[str]
    status: AssignmentStatuses
    reward_amount: Optional[str] = None
    reward_token: Optional[str] = DEFAULT_TOKEN
    created_at: datetime
    updated_at: datetime
    expires_at: datetime


class UserStatsResponse(BaseModel):
    assignments_amount: int
    submissions_sent: int
    assignments_completed: int
    assignments_rejected: int
    assignments_expired: int


class OracleStatsResponse(BaseModel):
    escrows_processed: int
    escrows_active: int
    escrows_cancelled: int
    workers_amount: int
    assignments_completed: int
    assignments_rejected: int
    assignments_expired: int
