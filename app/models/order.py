from .base import BaseDocument
from .enums import OrderStatus
from app.extensions import db


class Order(BaseDocument):
	__tablename__ = "orders"
	failure_reason = db.Column(db.Text, nullable=True)
	
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
