# pylint: disable=too-few-public-methods
from sqlalchemy import Column, String, DateTime, Enum, Integer, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.event import listens_for

from src.core.constants import (
    OracleWebhookTypes,
    OracleWebhookStatuses,
)
from src.db import Base
from src.core.constants import Networks


class Webhook(Base):
    __tablename__ = "webhooks"
    id = Column(String, primary_key=True, index=True)
    signature = Column(String, unique=True, index=True, nullable=False)
    escrow_address = Column(String(42), nullable=False)
    chain_id = Column(Integer, Enum(Networks), nullable=False)
    s3_url = Column(String)
    type = Column(String, Enum(OracleWebhookTypes), nullable=False)
    status = Column(
        String,
        Enum(OracleWebhookStatuses),
        server_default=OracleWebhookStatuses.pending.value,
    )
    attempts = Column(Integer, server_default="0")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    wait_until = Column(DateTime(timezone=True), server_default=func.now())
    __table_args__ = (
        UniqueConstraint("escrow_address", "type", name="_escrow_address_type_uc"),
    )

    def __repr__(self):
        return f"Webhook. id={self.id}"


@listens_for(Webhook, "before_insert")
def validate_type_and_s3_url_on_insert(mapper, connection, target):
    if (
        target.type == OracleWebhookTypes.recording_oracle.value
        and target.s3_url is None
    ):
        raise ValueError(
            f"Cannot create a webhook with type {OracleWebhookTypes.recording_oracle.value} and s3_url set to None."
        )
