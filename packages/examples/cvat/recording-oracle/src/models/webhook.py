# pylint: disable=too-few-public-methods
from sqlalchemy import JSON, Column, DateTime, Enum, Integer, String
from sqlalchemy.sql import func

from src.core.types import Networks, OracleWebhookStatuses, OracleWebhookTypes
from src.db import Base


class Webhook(Base):
    __tablename__ = "webhooks"
    id = Column(String, primary_key=True, index=True)
    signature = Column(String, unique=True, index=True, nullable=True)
    escrow_address = Column(String(42), nullable=False)
    chain_id = Column(Integer, Enum(Networks), nullable=False)
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
    event_type = Column(String, nullable=False)
    event_data = Column(JSON, nullable=True, server_default=None)
    direction = Column(String, nullable=False)

    def __repr__(self) -> str:
        return f"Webhook. id={self.id} type={self.type}.{self.event_type}"
