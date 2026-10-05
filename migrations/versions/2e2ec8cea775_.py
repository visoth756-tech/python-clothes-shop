"""empty message

Revision ID: 2e2ec8cea775
Revises: 1c6c03c79961
Create Date: 2026-10-05 17:59:16.272734

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2e2ec8cea775'
down_revision = '1c6c03c79961'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("rate_limit_logs", schema=None) as batch_op:
        batch_op.alter_column(
            "user_id",
            existing_type=sa.VARCHAR(length=36),
            nullable=True
        )


def downgrade():
    with op.batch_alter_table("rate_limit_logs", schema=None) as batch_op:
        batch_op.alter_column(
            "user_id",
            existing_type=sa.VARCHAR(length=36),
            nullable=False
        )
