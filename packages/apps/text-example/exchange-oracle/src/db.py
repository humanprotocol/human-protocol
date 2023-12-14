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
    in_progress = "in_progress"
    completed = "completed"
    awaiting_upload = "awaiting_upload"
    awaiting_closure = "awaiting_closure"
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


class JobRequest(Base):
    """Represents a request by a job requester."""

    __tablename__ = "job_requests"

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, index=True, default=uuid4
    )
    escrow_address: Mapped[str] = mapped_column(String(42), nullable=False)
    chain_id: Mapped[int] = mapped_column(nullable=False)
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
    projects: Mapped[List["AnnotationProject"]] = relationship(
        back_populates="job_request"
    )

    __table_args__ = (
        UniqueConstraint("escrow_address", "chain_id", name="_escrow_address_chain_uc"),
    )


class AnnotationProject(Base):
    """An annotation project to be completed by one or more annotators."""

    __tablename__ = "annotation_projects"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str]
    job_request_id: Mapped[UUID] = mapped_column(ForeignKey("job_requests.id"))
    job_request: Mapped["JobRequest"] = relationship(back_populates="projects")
    worker_id = mapped_column(ForeignKey("worker.id"))
    worker: Mapped["Worker"] = relationship(back_populates="projects")
    status: Mapped[Statuses] = mapped_column(
        String, server_default=Statuses.pending.value
    )


class Worker(Base):
    __tablename__ = "worker"

    id: Mapped[str] = mapped_column(primary_key=True, index=True)
    username: Mapped[str]
    is_validated: Mapped[bool] = mapped_column(default=False)
    password: Mapped[str]
    projects: Mapped[List["AnnotationProject"]] = relationship(back_populates="worker")


def username_to_worker_address_map() -> dict[str, str]:
    """Returns a dictionary, mapping usernames to worker_ids"""
    username_map = {}
    with Session() as session:
        for worker in session.query(Worker).all():
            username_map[worker.username] = worker.id
    return username_map


def stage_success(job_request: JobRequest):
    """Handles sucessful processing of a given stage by advancing the status and resetting retries"""
    job_request.status = next(Statuses[job_request.status])
    job_request.attempts = 0


def stage_failure(job_request: JobRequest):
    """Handles unsuccessful processing of a given stage by increasing attempts and setting status to failed, if necessary."""
    job_request.attempts = job_request.attempts + 1

    if job_request.attempts >= Config.max_attempts:
        job_request.status = Statuses.failed
