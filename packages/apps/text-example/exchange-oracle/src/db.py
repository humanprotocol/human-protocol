from enum import Enum

import sqlalchemy
from sqlalchemy import UniqueConstraint, String, DateTime
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Mapped, mapped_column
from sqlalchemy.sql import func

from src.config import Config

engine = sqlalchemy.create_engine(Config.postgres_config.connection_url())
Session = sessionmaker(autocommit=False, bind=engine)


class WebhookTypes(str, Enum):
    job_launcher = "job_launcher"
    recording_oracle = "recoring_oracle"


class WebhookStatuses(str, Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"


class Base(DeclarativeBase):
    pass


class JobRequest(Base):
    __tablename__ = "job_requests"

    id: Mapped[str] = mapped_column(primary_key=True, index=True)
    escrow_address: Mapped[str] = mapped_column(String(42), nullable=False)
    chain_id: Mapped[int] = mapped_column(nullable=False)
    manifest_url: Mapped[str]
    webhook_type: Mapped[str] = mapped_column(nullable=False)
    webhook_status: Mapped[WebhookStatuses] = mapped_column(
        String, server_default=WebhookStatuses.pending.value
    )
    created_at = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at = mapped_column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint(
            "escrow_address", "webhook_type", name="_escrow_address_type_uc"
        ),
    )
