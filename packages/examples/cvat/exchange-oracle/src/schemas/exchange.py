from datetime import datetime
from typing import Optional

from pydantic import AnyUrl, BaseModel, Field

from src.core.types import PlatformTypes, ProjectStatuses, TaskTypes


class AssignmentResponse(BaseModel):
    assignment_url: AnyUrl
    started_at: datetime
    finishes_at: datetime


class TaskResponse(BaseModel):
    id: str
    escrow_address: str
    title: str
    description: str
    platform: PlatformTypes
    job_bounty: str
    job_size: int
    job_time_limit: int
    job_type: TaskTypes
    assignment: Optional[AssignmentResponse] = None
    status: ProjectStatuses


class UserRequest(BaseModel):
    wallet_address: str = Field(min_length=1)
    cvat_email: str = Field(min_length=1)


class UserResponse(UserRequest):
    cvat_id: int


class AssignmentRequest(BaseModel):
    wallet_address: str
