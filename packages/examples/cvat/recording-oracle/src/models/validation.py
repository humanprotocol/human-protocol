# pylint: disable=too-few-public-methods
from __future__ import annotations

from typing import List

from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, relationship
from sqlalchemy.sql import func

from src.core.types import Networks
from src.db import Base


class Task(Base):
    __tablename__ = "tasks"
    id = Column(String, primary_key=True, index=True)
    escrow_address = Column(String(42), unique=True, nullable=False)
    chain_id = Column(Integer, Enum(Networks), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    jobs: Mapped[List["Job"]] = relationship(
        back_populates="task", cascade="all, delete", passive_deletes=True
    )


class Job(Base):
    __tablename__ = "jobs"
    id = Column(String, primary_key=True, index=True)
    cvat_id = Column(Integer, unique=True, index=True, nullable=False)
    task_id = Column(String, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)

    task: Mapped["Task"] = relationship(back_populates="jobs")
    validation_results: Mapped[List["ValidationResult"]] = relationship(
        back_populates="job", cascade="all, delete", passive_deletes=True
    )


class ValidationResult(Base):
    __tablename__ = "validation_results"
    id = Column(String, primary_key=True, index=True)
    job_id = Column(String, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    assignment_id = Column(String, unique=True, nullable=False)
    annotator_wallet_address = Column(String, nullable=False)
    annotation_quality = Column(Float, nullable=False)

    job: Mapped["Job"] = relationship(back_populates="validation_results")
