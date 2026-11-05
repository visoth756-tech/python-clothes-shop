from datetime import datetime, UTC

from app.extensions import db
from app.models import Order, Payment, Product
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
		"orderStatus": payment.order.status.value,
		"warning": payment.order.failure_reason,
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


def snapshot_warning(order):
	"""Compare fresh product values with the immutable checkout snapshot."""
	warnings = []
	quantities = {}
	for item in order.items:
		quantities[item.product_id] = quantities.get(item.product_id, 0) + item.qty
	products = Product.query.filter(Product.id.in_([key for key in quantities if key])).populate_existing().with_for_update().all()
	products = {product.id: product for product in products}
	for item in order.items:
		product = products.get(item.product_id)
		label = f'"{item.product_name}"'
		if not product:
			warnings.append(f'{label} is no longer available.')
			continue
		if product.name != item.product_name:
			warnings.append(f'{label} name changed to "{product.name}".')
		if product.price != item.price:
			warnings.append(f'{label} price changed from {item.price:.2f} to {product.price:.2f}.')
		if item.stock_snapshot is None:
			warnings.append(f'{label} has no stock snapshot. Please create a new order.')
		elif product.qty != item.stock_snapshot:
			warnings.append(f'{label} stock changed from {item.stock_snapshot} to {product.qty}.')
		elif product.qty < quantities[item.product_id]:
			warnings.append(f'{label} has insufficient stock ({product.qty} available).')
	return " ".join(dict.fromkeys(warnings))


def fail_order(order, warning):
	order.status = OrderStatus.FAILED
	order.failure_reason = warning
	for payment in order.payments:
		if payment.status == PaymentStatus.PENDING:
			payment.status = PaymentStatus.FAILED


def confirm_order(order):
	"""Claim the pending order and deduct stock together, once only."""
	quantities = {}
	for item in order.items:
		quantities[item.product_id] = quantities.get(item.product_id, 0) + item.qty
	try:
		with db.session.begin_nested():
			claimed = db.session.execute(db.update(Order).where(
				Order.id == order.id, Order.status == OrderStatus.PENDING
			).values(status=OrderStatus.CONFIRMED), execution_options={"synchronize_session": False})
			if claimed.rowcount != 1:
				db.session.refresh(order)
				return order.status == OrderStatus.CONFIRMED
			for product_id, qty in quantities.items():
				item = next(item for item in order.items if item.product_id == product_id)
				result = db.session.execute(db.update(Product).where(
					Product.id == product_id, Product.qty == item.stock_snapshot,
					Product.qty >= qty, Product.price == item.price,
					Product.name == item.product_name,
				).values(qty=Product.qty - qty), execution_options={"synchronize_session": False})
				if result.rowcount != 1:
					raise ValueError(f'"{item.product_name}" changed while confirming payment. Please contact support.')
		db.session.refresh(order)
		return True
	except ValueError as error:
		fail_order(order, str(error))
		return False


def create_payment(order, user_id, method):
	"""Create (or reuse) a payment for an order. Does not commit.

	Returns (payment, error, created).
	"""
	db.session.refresh(order, with_for_update=True)
	if order.status == OrderStatus.FAILED:
		return None, order.failure_reason or "This order has failed. Please create a new order.", False
	if order.status == OrderStatus.PENDING:
		warning = snapshot_warning(order)
		if warning:
			fail_order(order, warning)
			return None, warning, False
	existing = Payment.query.filter_by(
		order_id=order.id,
		method=method
	).first()

	if existing and existing.status != PaymentStatus.FAILED:
		if existing.status == PaymentStatus.PENDING and method == PaymentMethod.BAKONG:
			refresh_qr(existing)
		return existing, None, False
	if order.status != OrderStatus.PENDING:
		return None, "This order is already confirmed.", False

	payment = Payment(
		order_id=order.id,
		user_id=user_id,
		amount=order.total_amount,
		method=method,
	)

	if method == PaymentMethod.CASH:
		payment.status = PaymentStatus.PAID
		payment.paid_at = datetime.now(UTC)
		if not confirm_order(order):
			return None, order.failure_reason, False
	else:
		payment.status = PaymentStatus.PENDING
		refresh_qr(payment)

	order.payments.append(payment)

	return payment, None, True


def check_payment_status(payment):
	"""Refresh a pending Bakong payment against the provider. Returns the status."""
	if payment.method != PaymentMethod.BAKONG or payment.status != PaymentStatus.PENDING:
		return payment.status.value
	db.session.refresh(payment.order, with_for_update=True)
	warning = (payment.order.failure_reason if payment.order.status == OrderStatus.FAILED
		else snapshot_warning(payment.order) if payment.order.status == OrderStatus.PENDING else "")

	expires_at = _as_utc(payment.token_expires_at)


	status = bakong.check_status(payment.token, payment.transaction_id)

	if status == "PAID":
		payment.status = PaymentStatus.PAID
		payment.paid_at = datetime.now(UTC)
		if warning:
			fail_order(payment.order, warning + " Payment received; contact support for review or refund.")
		else:
			confirm_order(payment.order)
		db.session.commit()
	elif warning:
		fail_order(payment.order, warning)
		db.session.commit()
	elif expires_at is not None and expires_at <= datetime.now(UTC) and status != "FAILED":
		refresh_qr(payment)
		db.session.commit()
	elif status == "FAILED":
		payment.status = PaymentStatus.FAILED
		db.session.commit()

	return payment.status.value
