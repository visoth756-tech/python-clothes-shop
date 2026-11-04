from datetime import datetime, UTC

from app.extensions import db
from app.models import Payment
from app.models.enums import OrderStatus, PaymentMethod, PaymentStatus

from . import bakong


def parse_method(value):
	try:
		return PaymentMethod(str(value).upper()), None
	except (ValueError, TypeError):
		return None, "Payment method must be CASH or BAKONG."


def serialize_payment(payment):
	return {
		"id": payment.id,
		"orderId": payment.order_id,
		"userId": payment.user_id,
		"username": payment.order.username if payment.order else None,
		"amount": float(payment.amount) if payment.amount is not None else None,
		"status": payment.status.value,
		"method": payment.method.value,
		"transactionId": payment.transaction_id,
		"qrData": payment.qr_data,
		"token": payment.token,
		"tokenExpiresAt": _iso(payment.token_expires_at),
		"paidAt": _iso(payment.paid_at),
		"createdAt": _iso(payment.created_at),
		"updatedAt": _iso(payment.updated_at),
	}


def _iso(value):
	if value is None:
		return None
	if value.tzinfo is None:
		value = value.replace(tzinfo=UTC)
	return value.isoformat()


def _as_utc(value):
	if value is None:
		return None
	if value.tzinfo is None:
		return value.replace(tzinfo=UTC)
	return value.astimezone(UTC)


def refresh_qr(payment):
	"""Generate (or reset) the Bakong QR + token for a payment."""
	result = bakong.generate_qr(payment.amount, payment.order_id)

	payment.qr_data = result["qr"]
	payment.token = result["token"]
	payment.transaction_id = result["transaction_id"]
	payment.token_expires_at = result["expires_at"]


def create_payment(order, user_id, method):
	"""Create (or reuse) a payment for an order. Does not commit.

	Returns (payment, error, created).
	"""
	existing = Payment.query.filter_by(
		order_id=order.id,
		method=method
	).first()

	if existing and existing.status != PaymentStatus.FAILED:
		if existing.status == PaymentStatus.PENDING and method == PaymentMethod.BAKONG:
			refresh_qr(existing)
		return existing, None, False

	payment = Payment(
		order_id=order.id,
		user_id=user_id,
		amount=order.total_amount,
		method=method,
	)

	if method == PaymentMethod.CASH:
		payment.status = PaymentStatus.PAID
		payment.paid_at = datetime.now(UTC)
		order.status = OrderStatus.CONFIRMED
	else:
		payment.status = PaymentStatus.PENDING
		refresh_qr(payment)

	order.payments.append(payment)

	return payment, None, True


def check_payment_status(payment):
	"""Refresh a pending Bakong payment against the provider. Returns the status."""
	if payment.method != PaymentMethod.BAKONG or payment.status != PaymentStatus.PENDING:
		return payment.status.value

	expires_at = _as_utc(payment.token_expires_at)


	status = bakong.check_status(payment.token, payment.transaction_id)

	if status == "PAID":
		payment.status = PaymentStatus.PAID
		payment.paid_at = datetime.now(UTC)
		payment.order.status = OrderStatus.CONFIRMED
		db.session.commit()
	elif expires_at is not None and expires_at <= datetime.now(UTC) and status != "FAILED":
		refresh_qr(payment)
		db.session.commit()
	elif status == "FAILED":
		payment.status = PaymentStatus.FAILED
		db.session.commit()

	return payment.status.value
