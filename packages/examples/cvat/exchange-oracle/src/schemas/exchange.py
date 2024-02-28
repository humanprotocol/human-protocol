from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from src.core.types import AssignmentStatuses, Networks, ProjectStatuses, TaskTypes


class JobResponse(BaseModel):
    id: str
    escrow_address: str
    chain_id: int  # not Networks, as existing DB entries can be different from the current enum
    title: str
    description: Optional[str]
    bounty: Optional[str]
    job_type: TaskTypes
    size: Optional[int]
    status: ProjectStatuses


class UserRequest(BaseModel):
    wallet_address: str = Field(min_length=1)
    cvat_email: str = Field(min_length=1)


class UserResponse(UserRequest):
    cvat_id: int


class AssignmentRequest(BaseModel):
    wallet_address: str
    escrow_address: str
    chain_id: Networks


class AssignmentResponse(BaseModel):
    id: str
    escrow_address: str
    chain_id: int  # not Networks, as existing DB entries can be different from the current enum
    wallet_address: str
    size: Optional[int]
    job_type: TaskTypes
    status: AssignmentStatuses
    bounty: Optional[str]
    url: Optional[str]
    started_at: datetime
    expires_at: datetime
    finished_at: Optional[datetime]
