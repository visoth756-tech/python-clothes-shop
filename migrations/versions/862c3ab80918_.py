"""empty message

Revision ID: 862c3ab80918
Revises: 2e2ec8cea775
Create Date: 2026-10-05 18:13:18.761935

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '862c3ab80918'
down_revision = '2e2ec8cea775'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("rate_limit_logs", schema=None) as batch_op:
        batch_op.drop_column("user_id")


def downgrade():
    with op.batch_alter_table("rate_limit_logs", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "user_id",
                sa.VARCHAR(length=36),
                nullable=True
            )
        )