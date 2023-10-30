from enum import Enum
from typing import List
from uuid import uuid4


import sqlalchemy
from sqlalchemy import UniqueConstraint, String, DateTime, ForeignKey
from sqlalchemy.orm import (
    sessionmaker,
    DeclarativeBase,
    Mapped,
    mapped_column,
    relationship,
)
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID

from src.config import Config

engine = sqlalchemy.create_engine(Config.postgres_config.connection_url())
Session = sessionmaker(autocommit=False, bind=engine)


class Statuses(str, Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    failed = "failed"


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
    job_request_id: Mapped[UUID] = mapped_column(ForeignKey("job_requests.id"))
    job_request: Mapped["JobRequest"] = relationship(back_populates="projects")
    status: Mapped[Statuses] = mapped_column(
        String, server_default=Statuses.pending.value
    )
