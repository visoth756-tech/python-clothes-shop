"""Store checkout customer details, submission keys and notification delivery state."""
from alembic import op
import sqlalchemy as sa

revision = "e4f8a1b2c3d4"
down_revision = "c7e4a912db30"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("payments") as batch:
        batch.alter_column("status", existing_type=sa.Enum("PENDING", "PAID", "FAILED", name="paymentstatus"),
                           type_=sa.Enum("PENDING", "PAID", "FAILED", "CANCELLED", name="paymentstatus"), existing_nullable=False)
    with op.batch_alter_table("orders") as batch:
        for name, length in (("checkout_key", 64), ("first_name", 100), ("last_name", 100),
                             ("email", 254), ("phone", 32), ("delivery_address", 1000)):
            batch.add_column(sa.Column(name, sa.String(length), nullable=True))
        batch.create_unique_constraint("uq_orders_checkout_key", ["checkout_key"])
    op.create_table("order_notifications",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("order_id", sa.String(32), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("event", sa.String(100), nullable=False),
        sa.Column("status", sa.String(16), nullable=False),
        sa.UniqueConstraint("order_id", "event", name="uq_order_notification_event"))


def downgrade():
    op.execute("UPDATE payments SET status = 'FAILED' WHERE status = 'CANCELLED'")
    with op.batch_alter_table("payments") as batch:
        batch.alter_column("status", existing_type=sa.Enum("PENDING", "PAID", "FAILED", "CANCELLED", name="paymentstatus"),
                           type_=sa.Enum("PENDING", "PAID", "FAILED", name="paymentstatus"), existing_nullable=False)
    op.drop_table("order_notifications")
    with op.batch_alter_table("orders") as batch:
        batch.drop_constraint("uq_orders_checkout_key", type_="unique")
        for name in ("checkout_key", "first_name", "last_name", "email", "phone", "delivery_address"):
            batch.drop_column(name)
