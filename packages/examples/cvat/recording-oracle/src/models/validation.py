# pylint: disable=too-few-public-methods
from __future__ import annotations

import json
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Column, DateTime, Enum, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, relationship
from sqlalchemy.sql import func

from src.core.gt_stats import GtKey
from src.core.types import Networks
from src.db import Base

if TYPE_CHECKING:
    from collections.abc import Sequence


class Task(Base):
    __tablename__ = "tasks"
    id = Column(String, primary_key=True, index=True)
    escrow_address = Column(String(42), unique=True, nullable=False)
    chain_id = Column(Integer, Enum(Networks), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    cleaned_at = Column(DateTime(timezone=True), nullable=True)
    iteration = Column(Integer, server_default="0", nullable=False)

    jobs: Mapped[list[Job]] = relationship(
        back_populates="task", cascade="all, delete", passive_deletes=True
    )
    gt_stats: Mapped[list[GtStats]] = relationship(
        back_populates="task", cascade="all, delete", passive_deletes=True
    )


class Job(Base):
    __tablename__ = "jobs"
    id = Column(String, primary_key=True, index=True)
    cvat_id = Column(Integer, unique=True, index=True, nullable=False)
    task_id = Column(String, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)

    task: Mapped[Task] = relationship(back_populates="jobs")
    validation_results: Mapped[list[ValidationResult]] = relationship(
        back_populates="job", cascade="all, delete", passive_deletes=True
    )


class ValidationResult(Base):
    __tablename__ = "validation_results"
    id = Column(String, primary_key=True, index=True)
    job_id = Column(String, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    assignment_id = Column(String, unique=True, nullable=False)
    annotator_wallet_address = Column(String, nullable=False)
    annotation_quality = Column(Float, nullable=False)

    job: Mapped[Job] = relationship(back_populates="validation_results")


class GtStats(Base):
    __tablename__ = "gt_stats"

    # A composite primary key is used
    task_id = Column(
        String, ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True, nullable=False
    )
    gt_frame_name = Column(String, primary_key=True, nullable=False)
    label_set = Column(String, primary_key=True, nullable=False)

    failed_attempts = Column(Integer, default=0, nullable=False)
    accepted_attempts = Column(Integer, default=0, nullable=False)
    total_uses = Column(Integer, default=0, nullable=False)

    accumulated_quality = Column(Float, default=0.0, nullable=False)

    enabled = Column(Boolean, default=True, nullable=False)

    task: Mapped[Task] = relationship(back_populates="gt_stats")

    @property
    def gt_key(self) -> GtKey:
        return GtKey(filename=self.gt_frame_name, labels=self.decode_label_set(self.label_set))

    @staticmethod
    def decode_label_set(data: str) -> Sequence[str]:
        return json.loads(data)

    @staticmethod
    def encode_label_set(labels: set[str]) -> str:
        return json.dumps(sorted(labels))
