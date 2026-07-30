"""
Add assignment bounty

Revision ID: b7c1f0a4d2e3
Revises: a5907f01ac2d
Create Date: 2026-07-29 14:30:00.000000

"""

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "b7c1f0a4d2e3"
down_revision = "a5907f01ac2d"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("validation_results", sa.Column("assignment_bounty", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("validation_results", "assignment_bounty")
