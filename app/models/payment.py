from .base import BaseDocument
from .enums import PaymentStatus, PaymentMethod
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
	
	method = db.Column(
		db.Enum(PaymentMethod),
		nullable=False,
		default=PaymentMethod.CASH
	)

	transaction_id = db.Column(
		db.String(255),
		nullable=True
	)

	token = db.Column(
		db.String(255),
		nullable=True
	)

	token_expires_at = db.Column(
		db.DateTime(timezone=True),
		nullable=True
	)

	qr_data = db.Column(
		db.Text,
		nullable=True
	)

	paid_at = db.Column(
		db.DateTime(timezone=True),
		nullable=True
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
