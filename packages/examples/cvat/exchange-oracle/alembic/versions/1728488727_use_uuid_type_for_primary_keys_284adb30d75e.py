"""Use UUID type for primary keys

Revision ID: 284adb30d75e
Revises: fde2b09b6b39
Create Date: 2024-10-09 17:45:27.692538

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "284adb30d75e"
down_revision = "fde2b09b6b39"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE assignments ALTER COLUMN id TYPE UUID USING id::uuid")
    op.execute("ALTER TABLE data_uploads ALTER COLUMN id TYPE UUID USING id::uuid")
    op.execute("ALTER TABLE escrow_creations ALTER COLUMN id TYPE UUID USING id::uuid")
    op.execute("ALTER TABLE escrow_validations ALTER COLUMN id TYPE UUID USING id::uuid")
    op.execute("ALTER TABLE images ALTER COLUMN id TYPE UUID USING id::uuid")
    op.execute("ALTER TABLE jobs ALTER COLUMN id TYPE UUID USING id::uuid")
    op.execute("ALTER TABLE projects ALTER COLUMN id TYPE UUID USING id::uuid")
    op.execute("ALTER TABLE tasks ALTER COLUMN id TYPE UUID USING id::uuid")
    op.execute("ALTER TABLE webhooks ALTER COLUMN id TYPE UUID USING id::uuid")


def downgrade() -> None:
    op.execute("ALTER TABLE webhooks ALTER COLUMN id TYPE VARCHAR USING id::text")
    op.execute("ALTER TABLE tasks ALTER COLUMN id TYPE VARCHAR USING id::text")
    op.execute("ALTER TABLE projects ALTER COLUMN id TYPE VARCHAR USING id::text")
    op.execute("ALTER TABLE jobs ALTER COLUMN id TYPE VARCHAR USING id::text")
    op.execute("ALTER TABLE images ALTER COLUMN id TYPE VARCHAR USING id::text")
    op.execute("ALTER TABLE escrow_validations ALTER COLUMN id TYPE VARCHAR USING id::text")
    op.execute("ALTER TABLE escrow_creations ALTER COLUMN id TYPE VARCHAR USING id::text")
    op.execute("ALTER TABLE data_uploads ALTER COLUMN id TYPE VARCHAR USING id::text")
    op.execute("ALTER TABLE assignments ALTER COLUMN id TYPE VARCHAR USING id::text")
