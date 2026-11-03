"""add description to products

Revision ID: 777445595e2a
Revises: 862c3ab80918
Create Date: 2026-11-03

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '777445595e2a'
down_revision = '862c3ab80918'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("products", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "description",
                sa.String(length=500),
                nullable=True
            )
        )


def downgrade():
    with op.batch_alter_table("products", schema=None) as batch_op:
        batch_op.drop_column("description")
