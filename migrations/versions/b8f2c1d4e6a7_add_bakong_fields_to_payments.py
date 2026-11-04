"""add bakong fields to payments

Revision ID: b8f2c1d4e6a7
Revises: dec334941e17
Create Date: 2026-11-04

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b8f2c1d4e6a7'
down_revision = 'dec334941e17'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('payments', schema=None) as batch_op:
        batch_op.add_column(sa.Column('transaction_id', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('token', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('token_expires_at', sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column('qr_data', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True))


def downgrade():
    with op.batch_alter_table('payments', schema=None) as batch_op:
        batch_op.drop_column('paid_at')
        batch_op.drop_column('qr_data')
        batch_op.drop_column('token_expires_at')
        batch_op.drop_column('token')
        batch_op.drop_column('transaction_id')
