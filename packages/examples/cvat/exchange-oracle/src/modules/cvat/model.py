# pylint: disable=too-few-public-methods
from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, Integer
from sqlalchemy.sql import func

from .constants import TaskStatuses, JobStatuses
from src.db import Base


class Project(Base):
    __tablename__ = "projects"
    id = Column(String, primary_key=True, index=True)
    cvat_id = Column(Integer, unique=True, index=True, nullable=False)
    status = Column(String, Enum(TaskStatuses), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"Project. id={self.id}"


class Task(Base):
    __tablename__ = "tasks"
    id = Column(String, primary_key=True, index=True)
    cvat_id = Column(Integer, unique=True, index=True, nullable=False)
    cvat_project_id = Column(Integer, ForeignKey("projects.cvat_id"), nullable=False)
    status = Column(String, Enum(TaskStatuses), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"Task. id={self.id}"


class Job(Base):
    __tablename__ = "jobs"
    id = Column(String, primary_key=True, index=True)
    cvat_id = Column(Integer, unique=True, index=True, nullable=False)
    cvat_task_id = Column(Integer, ForeignKey("tasks.cvat_id"), nullable=False)
    cvat_project_id = Column(Integer, ForeignKey("projects.cvat_id"), nullable=False)
    status = Column(String, Enum(JobStatuses), nullable=False)
    assignee = Column(String(42), index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"Job. id={self.id}"
