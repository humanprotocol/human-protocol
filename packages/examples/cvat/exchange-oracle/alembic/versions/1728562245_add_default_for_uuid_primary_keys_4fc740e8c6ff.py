"""Add default for UUID primary keys

Revision ID: 4fc740e8c6ff
Revises: 284adb30d75e
Create Date: 2024-10-10 14:10:45.948593

"""

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "4fc740e8c6ff"
down_revision = "284adb30d75e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("assignments", "id", server_default=sa.text("uuid_generate_v4()"))
    op.alter_column("data_uploads", "id", server_default=sa.text("uuid_generate_v4()"))
    op.alter_column("escrow_creations", "id", server_default=sa.text("uuid_generate_v4()"))
    op.alter_column("images", "id", server_default=sa.text("uuid_generate_v4()"))
    op.alter_column("jobs", "id", server_default=sa.text("uuid_generate_v4()"))
    op.alter_column("projects", "id", server_default=sa.text("uuid_generate_v4()"))
    op.alter_column("tasks", "id", server_default=sa.text("uuid_generate_v4()"))
    op.alter_column("webhooks", "id", server_default=sa.text("uuid_generate_v4()"))


def downgrade() -> None:
    op.alter_column("webhooks", "id", server_default=None)
    op.alter_column("tasks", "id", server_default=None)
    op.alter_column("projects", "id", server_default=None)
    op.alter_column("jobs", "id", server_default=None)
    op.alter_column("images", "id", server_default=None)
    op.alter_column("escrow_creations", "id", server_default=None)
    op.alter_column("data_uploads", "id", server_default=None)
    op.alter_column("assignments", "id", server_default=None)
