from .base import BaseDocument
from .enums import PaymentStatus
from app.extensions import db


class Payment(BaseDocument):
	__tablename__ = "payments"
	
	order_id = db.Column(
		db.String(32),
		db.ForeignKey("orders.id"),
		nullable=False
	)
	
	user_id = db.Column(
		db.String(32),
		db.ForeignKey("users.id"),
		nullable=False
	)
	
	amount = db.Column(
		db.Numeric(12, 2),
		nullable=False
	)
	
	status = db.Column(
		db.Enum(PaymentStatus),
		nullable=False,
		default=PaymentStatus.PENDING
	)
	
	order = db.relationship(
		"Order",
		back_populates="payments"
	)
	
	__table_args__ = (
		db.CheckConstraint(
			"amount >= 0.0",
			name="ck_payment_amount_min"
		),
	)
