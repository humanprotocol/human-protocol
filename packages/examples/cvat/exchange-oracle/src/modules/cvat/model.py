# pylint: disable=too-few-public-methods
from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .constants import ProjectStatuses, TaskStatuses, JobStatuses, JobTypes
from src.db import Base


class Project(Base):
    __tablename__ = "projects"
    id = Column(String, primary_key=True, index=True)
    cvat_id = Column(Integer, unique=True, index=True, nullable=False)
    cvat_cloudstorage_id = Column(Integer, index=True, nullable=False)
    status = Column(String, Enum(ProjectStatuses), nullable=False)
    job_type = Column(String, Enum(JobTypes), nullable=False)
    escrow_address = Column(String(42), unique=True, nullable=False)
    bucket_url = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    tasks = relationship(
        "Task",
        back_populates="projects",
        cascade="all, delete",
        passive_deletes=True,
    )

    jobs = relationship(
        "Job",
        back_populates="projects",
        cascade="all, delete",
        passive_deletes=True,
    )

    def __repr__(self):
        return f"Project. id={self.id}"


class Task(Base):
    __tablename__ = "tasks"
    id = Column(String, primary_key=True, index=True)
    cvat_id = Column(Integer, unique=True, index=True, nullable=False)
    cvat_project_id = Column(
        Integer, ForeignKey("projects.cvat_id", ondelete="CASCADE"), nullable=False
    )
    status = Column(String, Enum(TaskStatuses), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    projects = relationship("Project", back_populates="tasks")
    jobs = relationship(
        "Job",
        back_populates="tasks",
        cascade="all, delete",
        passive_deletes=True,
    )

    def __repr__(self):
        return f"Task. id={self.id}"


class Job(Base):
    __tablename__ = "jobs"
    id = Column(String, primary_key=True, index=True)
    cvat_id = Column(Integer, unique=True, index=True, nullable=False)
    cvat_task_id = Column(
        Integer, ForeignKey("tasks.cvat_id", ondelete="CASCADE"), nullable=False
    )
    cvat_project_id = Column(
        Integer, ForeignKey("projects.cvat_id", ondelete="CASCADE"), nullable=False
    )
    status = Column(String, Enum(JobStatuses), nullable=False)
    assignee = Column(String(42), index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    tasks = relationship("Task", back_populates="jobs")
    projects = relationship("Project", back_populates="jobs")

    def __repr__(self):
        return f"Job. id={self.id}"
