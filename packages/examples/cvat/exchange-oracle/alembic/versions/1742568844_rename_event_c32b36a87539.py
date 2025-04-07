"""
Rename "job_creation_failed" to "escrow_failed"

Revision ID: c32b36a87539
Revises: 0a91b6a5f7b6
Create Date: 2025-03-21 16:54:04.057456

"""

from sqlalchemy import Column, String, update
from sqlalchemy.orm import declarative_base

from alembic import op

# revision identifiers, used by Alembic.
revision = "c32b36a87539"
down_revision = "0a91b6a5f7b6"
branch_labels = None
depends_on = None


Base = declarative_base()

old_name = "job_creation_failed"
new_name = "escrow_failed"


class Webhook(Base):
    # Represents the model before the transaction is applied

    __tablename__ = "webhooks"
    id = Column(String, primary_key=True, index=True)
    event_type = Column(String, nullable=False)


def update_webhook_types():
    op.execute(update(Webhook).where(Webhook.event_type == old_name).values(event_type=new_name))


def revert_webhook_types():
    op.execute(update(Webhook).where(Webhook.event_type == new_name).values(event_type=old_name))


def upgrade() -> None:
    update_webhook_types()


def downgrade() -> None:
    revert_webhook_types()
