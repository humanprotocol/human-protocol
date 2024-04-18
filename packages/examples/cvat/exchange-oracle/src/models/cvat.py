# pylint: disable=too-few-public-methods
from __future__ import annotations

from typing import List, Optional

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, relationship
from sqlalchemy.sql import func

from src.core.types import (
    AssignmentStatuses,
    JobStatuses,
    Networks,
    ProjectStatuses,
    TaskStatuses,
    TaskTypes,
)
from src.db import Base
from src.utils.time import utcnow


class Project(Base):
    __tablename__ = "projects"
    id = Column(String, primary_key=True, index=True)
    cvat_id = Column(Integer, unique=True, index=True, nullable=False)
    cvat_cloudstorage_id = Column(Integer, index=True, nullable=False)
    status = Column(String, Enum(ProjectStatuses), nullable=False)
    job_type = Column(String, Enum(TaskTypes), nullable=False)
    escrow_address = Column(
        String(42), unique=False, nullable=False
    )  # TODO: extract into a separate model
    chain_id = Column(Integer, Enum(Networks), nullable=False)
    bucket_url = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    cvat_webhook_id = Column(Integer, nullable=True)

    images: Mapped[List["Image"]] = relationship(
        back_populates="project", cascade="all, delete", passive_deletes=True
    )

    tasks: Mapped[List["Task"]] = relationship(
        back_populates="project",
        cascade="all, delete",
        passive_deletes=True,
    )

    jobs: Mapped[List["Job"]] = relationship(
        back_populates="project",
        cascade="all, delete",
        passive_deletes=True,
    )

    escrow_creation: Mapped["EscrowCreation"] = relationship(
        back_populates="projects",
        passive_deletes=True,
        # A custom join is used because the foreign keys do not actually reference any objects
        primaryjoin=(
            "and_("
            "Project.escrow_address == EscrowCreation.escrow_address, "
            "Project.chain_id == EscrowCreation.chain_id"
            ")"
        ),
        foreign_keys=[escrow_address, chain_id],
    )

    def __repr__(self):
        return f"Project. id={self.id}"


class Task(Base):
    __tablename__ = "tasks"
    id = Column(String, primary_key=True, index=True)
    cvat_id = Column(Integer, unique=True, index=True, nullable=False)
    cvat_project_id = Column(
        Integer,
        ForeignKey("projects.cvat_id", ondelete="CASCADE"),
        nullable=False,
    )
    status = Column(String, Enum(TaskStatuses), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    project: Mapped["Project"] = relationship(back_populates="tasks")
    jobs: Mapped[List["Job"]] = relationship(
        back_populates="task",
        cascade="all, delete",
        passive_deletes=True,
    )
    data_upload: Mapped["DataUpload"] = relationship(
        back_populates="task", cascade="all, delete", passive_deletes=True
    )

    def __repr__(self):
        return f"Task. id={self.id}"


class EscrowCreation(Base):
    __tablename__ = "escrow_creations"
    id = Column(String, primary_key=True, index=True)

    escrow_address = Column(String(42), index=True, nullable=False)
    chain_id = Column(Integer, Enum(Networks), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    finished_at = Column(DateTime(timezone=True), nullable=True, server_default=None)
    # TODO: maybe add expiration

    total_jobs = Column(Integer, nullable=False)

    projects: Mapped[List["Project"]] = relationship(
        back_populates="escrow_creation",
        # A custom join is used because the foreign keys do not actually reference any objects
        primaryjoin=(
            "and_("
            "Project.escrow_address == EscrowCreation.escrow_address, "
            "Project.chain_id == EscrowCreation.chain_id"
            ")"
        ),
        foreign_keys=[Project.escrow_address, Project.chain_id],
    )

    def __repr__(self):
        return f"EscrowCreation. id={self.id} escrow={self.escrow_address}"


class DataUpload(Base):
    __tablename__ = "data_uploads"
    id = Column(String, primary_key=True, index=True)
    task_id = Column(
        Integer,
        ForeignKey("tasks.cvat_id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )

    task: Mapped["Task"] = relationship(back_populates="data_upload")

    def __repr__(self):
        return f"DataUpload. id={self.id} task={self.task_id}"


class Job(Base):
    __tablename__ = "jobs"
    id = Column(String, primary_key=True, index=True)
    cvat_id = Column(Integer, unique=True, index=True, nullable=False)
    cvat_task_id = Column(Integer, ForeignKey("tasks.cvat_id", ondelete="CASCADE"), nullable=False)
    cvat_project_id = Column(
        Integer,
        ForeignKey("projects.cvat_id", ondelete="CASCADE"),
        nullable=False,
    )
    status = Column(String, Enum(JobStatuses), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    task: Mapped["Task"] = relationship(back_populates="jobs")
    project: Mapped["Project"] = relationship(back_populates="jobs")
    assignments: Mapped[List["Assignment"]] = relationship(
        back_populates="job",
        cascade="all, delete",
        passive_deletes=True,
        order_by="desc(Assignment.created_at)",
    )

    @property
    def latest_assignment(self) -> Optional[Assignment]:
        assignments = self.assignments
        return assignments[0] if assignments else None

    def __repr__(self):
        return f"Job. id={self.id}"


class User(Base):
    __tablename__ = "users"
    wallet_address = Column(String, primary_key=True, index=True, nullable=False)
    cvat_email = Column(String, unique=True, index=True, nullable=True)
    cvat_id = Column(Integer, unique=True, index=True, nullable=True)

    assignments: Mapped[List["Assignment"]] = relationship(
        back_populates="user", cascade="all, delete", passive_deletes=True
    )

    def __repr__(self):
        return f"User. wallet_address={self.wallet_address} cvat_id={self.cvat_id}"


class Assignment(Base):
    __tablename__ = "assignments"
    id = Column(String, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True, server_default=None)
    user_wallet_address = Column(
        String,
        ForeignKey("users.wallet_address", ondelete="CASCADE"),
        nullable=False,
    )
    cvat_job_id = Column(Integer, ForeignKey("jobs.cvat_id", ondelete="CASCADE"), nullable=False)
    status = Column(
        String,
        Enum(AssignmentStatuses),
        server_default=AssignmentStatuses.created.value,
        nullable=False,
    )

    user: Mapped["User"] = relationship(back_populates="assignments")
    job: Mapped["Job"] = relationship(back_populates="assignments")

    @property
    def is_finished(self) -> bool:
        return (
            self.completed_at
            or utcnow() > self.expires_at
            or self.status != AssignmentStatuses.created
        )

    def __repr__(self):
        return f"Assignment. id={self.id} user={self.user.cvat_id} job={self.job.cvat_id}"


class Image(Base):
    __tablename__ = "images"
    id = Column(String, primary_key=True, index=True)
    cvat_project_id = Column(
        Integer,
        ForeignKey("projects.cvat_id", ondelete="CASCADE"),
        nullable=False,
    )
    filename = Column(String, nullable=False)

    project: Mapped["Project"] = relationship(back_populates="images")

    __table_args__ = (UniqueConstraint("cvat_project_id", "filename", name="_project_filename_uc"),)

    def __repr__(self):
        return (
            f"Image. id={self.id} cvat_project_id={self.cvat_project_id} filename={self.filename}"
        )
