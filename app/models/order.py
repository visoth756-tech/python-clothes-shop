from .base import BaseDocument
from .enums import OrderStatus
from app.extensions import db


class Order(BaseDocument):
	__tablename__ = "orders"
	failure_reason = db.Column(db.Text, nullable=True)
	checkout_key = db.Column(db.String(64), unique=True, nullable=True)
	first_name = db.Column(db.String(100), nullable=True)
	last_name = db.Column(db.String(100), nullable=True)
	email = db.Column(db.String(254), nullable=True)
	phone = db.Column(db.String(32), nullable=True)
	delivery_address = db.Column(db.String(1000), nullable=True)
	
	user_id = db.Column(
		db.String(32),
		db.ForeignKey("users.id"),
		nullable=False
	)
	
	username = db.Column(
		db.String(255),
		nullable=False
	)
	
	total_amount = db.Column(
		db.Numeric(12, 2),
		nullable=False
	)
	
	status = db.Column(
		db.Enum(OrderStatus),
		nullable=False,
		default=OrderStatus.PENDING
	)
	
	items = db.relationship(
		"OrderItem",
		back_populates="order",
		cascade="all, delete-orphan"
	)
	
	payments = db.relationship(
		"Payment",
		back_populates="order"
	)
	
	__table_args__ = (
		db.CheckConstraint(
			"total_amount >= 0.0",
			name="ck_order_total_min"
		),
	)


class OrderNotification(BaseDocument):
	"""One delivery attempt per order event, including ambiguous network failures."""
	__tablename__ = "order_notifications"
	order_id = db.Column(db.String(32), db.ForeignKey("orders.id"), nullable=False)
	event = db.Column(db.String(100), nullable=False)
	status = db.Column(db.String(16), nullable=False, default="SENDING")
	__table_args__ = (db.UniqueConstraint("order_id", "event", name="uq_order_notification_event"),)
