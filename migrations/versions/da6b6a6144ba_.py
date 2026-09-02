"""empty message

Revision ID: da6b6a6144ba
Revises: b57782292619
Create Date: 2026-09-01 10:27:49.925651

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'da6b6a6144ba'
down_revision = 'b57782292619'
branch_labels = None
depends_on = None


def upgrade():
	with op.batch_alter_table('products', schema=None) as batch_op:
		batch_op.create_unique_constraint(
			'uq_products_name',
			['name']
		)


def downgrade():
	with op.batch_alter_table('products', schema=None) as batch_op:
		batch_op.drop_constraint(
			'uq_products_name',
			type_='unique'
		)
