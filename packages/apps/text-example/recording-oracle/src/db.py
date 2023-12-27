import datetime
from enum import Enum
from typing import List
from uuid import uuid4

import sqlalchemy
from sqlalchemy import DateTime, ForeignKey, Sequence, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    mapped_column,
    relationship,
    sessionmaker,
)
from sqlalchemy.sql import func
from src.config import Config

engine = sqlalchemy.create_engine(Config.postgres_config.connection_url())
Session = sessionmaker(autocommit=False, bind=engine)


class Statuses(str, Enum):
    pending = "pending"
    awaiting_upload = "awaiting_upload"
    closed = "closed"
    failed = "failed"

    def __next__(self):
        if self == Statuses.failed:
            return self
        statuses = list(Statuses)
        i = statuses.index(self)
        return statuses[i + 1]


class Base(DeclarativeBase):
    pass


class ResultsProcessingRequest(Base):
    """Represents a request to process raw results by an exchange oracle."""

    __tablename__ = "processing_requests"

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, index=True, default=uuid4
    )

    escrow_address: Mapped[str] = mapped_column(String(42), nullable=False)
    chain_id: Mapped[int] = mapped_column(nullable=False)
    type: Mapped[str] = mapped_column(default="text_label_multiple_span_select")

    solution_url: Mapped[str]

    status: Mapped[Statuses] = mapped_column(
        String, server_default=Statuses.pending.value
    )
    created_at = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at = mapped_column(DateTime(timezone=True), onupdate=func.now())
    expires_at = mapped_column(
        DateTime(timezone=True),
        onupdate=func.now(),
        default=lambda _: datetime.datetime.now()
        + datetime.timedelta(days=Config.default_job_expiry_days),
    )
    attempts: Mapped[int] = mapped_column(default=0)

    __table_args__ = (
        UniqueConstraint("escrow_address", "chain_id", name="_escrow_address_chain_uc"),
    )


def stage_success(request: ResultsProcessingRequest):
    """Handles sucessful processing of a given stage by advancing the status and resetting retries"""
    request.status = next(Statuses[request.status])
    request.attempts = 0


def stage_failure(request: ResultsProcessingRequest):
    """Handles unsuccessful processing of a given stage by increasing attempts and setting status to failed, if necessary."""
    request.attempts = request.attempts + 1

    if request.attempts >= Config.max_attempts:
        request.status = Statuses.failed
