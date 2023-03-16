# pylint: disable=too-few-public-methods
from sqlalchemy import Column, String, DateTime, Enum
from sqlalchemy.sql import func


from .constants import Networks, WebhookTypes, WebhookStatuses
from src.db import Base


class Webhook(Base):
    __tablename__ = "webhooks"
    id = Column(String, primary_key=True, index=True)
    signature = Column(String, unique=True, index=True, nullable=False)
    escrow_address = Column(String(42), unique=True, nullable=False)
    network_id = Column(String, Enum(Networks), nullable=False)
    type = Column(Enum(WebhookTypes))
    status = Column(Enum(WebhookStatuses), server_default=WebhookStatuses.pending.value)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    wait_until = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"Webhook. id={self.id}"
