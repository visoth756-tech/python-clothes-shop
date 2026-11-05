"""Add order stock snapshots and failure warnings.

Revision ID: c7e4a912db30
Revises: b8f2c1d4e6a7
"""
from alembic import op
import sqlalchemy as sa

revision = 'c7e4a912db30'
down_revision = 'b8f2c1d4e6a7'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('orders') as batch:
        batch.alter_column('status', existing_type=sa.Enum('PENDING', 'CONFIRMED', name='orderstatus'),
                           type_=sa.Enum('PENDING', 'CONFIRMED', 'FAILED', name='orderstatus'))
        batch.add_column(sa.Column('failure_reason', sa.Text(), nullable=True))
    with op.batch_alter_table('order_items') as batch:
        batch.add_column(sa.Column('stock_snapshot', sa.Integer(), nullable=True))


def downgrade():
    op.execute("UPDATE orders SET status = 'PENDING' WHERE status = 'FAILED'")
    with op.batch_alter_table('order_items') as batch:
        batch.drop_column('stock_snapshot')
    with op.batch_alter_table('orders') as batch:
        batch.drop_column('failure_reason')
        batch.alter_column('status', existing_type=sa.Enum('PENDING', 'CONFIRMED', 'FAILED', name='orderstatus'),
                           type_=sa.Enum('PENDING', 'CONFIRMED', name='orderstatus'))
