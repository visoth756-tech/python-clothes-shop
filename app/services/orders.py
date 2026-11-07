from datetime import UTC
from decimal import Decimal
import re
from sqlalchemy.exc import IntegrityError

from app.extensions import db
from app.models import Order, OrderItem, Product
from app.models.enums import OrderStatus

from .payments import create_payment, parse_method, serialize_payment
from .telegram import notify_order


def serialize_order(order):
	return {
		"id": order.id,
		"userId": order.user_id,
		"username": order.username,
		"totalAmount": float(order.total_amount) if order.total_amount is not None else None,
		"status": order.status.value,
		"warning": order.failure_reason,
		"customer": {name: getattr(order, name) for name in
		             ("first_name", "last_name", "email", "phone", "delivery_address")},
		"items": [
			{
				"id": item.id,
				"productId": item.product_id,
				"productName": item.product_name,
				"qty": item.qty,
				"price": float(item.price) if item.price is not None else None,
				"subtotal": float(item.subtotal) if item.subtotal is not None else None,
			}
			for item in order.items
		],
		"payments": [serialize_payment(payment) for payment in order.payments],
		"createdAt": _iso(order.created_at),
		"updatedAt": _iso(order.updated_at),
	}


def _iso(value):
	if value is None:
		return None
	if value.tzinfo is None:
		value = value.replace(tzinfo=UTC)
	return value.isoformat()


def parse_items(data):
	raw = data.get("items") if isinstance(data, dict) else None

	if not isinstance(raw, list) or not raw:
		return None, "Items are required."

	quantities = {}
	for entry in raw:
		if not isinstance(entry, dict):
			return None, "Each item must be an object."

		product_id = entry.get("product_id")

		if not isinstance(product_id, str) or not product_id:
			return None, "Each item needs a product_id."

		if isinstance(entry.get("qty", 1), bool) or isinstance(entry.get("qty", 1), float):
			return None, "Item qty must be a whole number."
		try:
			qty = int(entry.get("qty", 1))
		except (TypeError, ValueError):
			return None, "Item qty must be a whole number."

		if qty < 1:
			return None, "Item qty must be at least 1."

		quantities[product_id] = quantities.get(product_id, 0) + qty

	return [{"product_id": key, "qty": qty} for key, qty in quantities.items()], None


def parse_customer(data):
    customer = {}
    for name, maximum in (("first_name", 100), ("last_name", 100), ("email", 254),
                          ("phone", 32), ("delivery_address", 1000)):
        value = data.get(name)
        if not isinstance(value, str) or not value.strip() or len(value.strip()) > maximum:
            return None, f"{name.replace('_', ' ').title()} is required (maximum {maximum} characters)."
        customer[name] = value.strip()
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", customer["email"]):
        return None, "Enter a valid email address."
    if not re.fullmatch(r"[+0-9() .-]{7,32}", customer["phone"]) or sum(c.isdigit() for c in customer["phone"]) < 7:
        return None, "Enter a valid phone number."
    return customer, None


def create_order(user, data, method_value=None):
	"""Create a pending order; optionally support existing API payment selection.

	Returns (order, error, status_code).
	"""
	key = data.get("checkout_key")
	if not isinstance(key, str) or not re.fullmatch(r"[a-f0-9]{32,64}", key):
		return None, "A valid checkout_key is required. Reload checkout and try again.", 400
	existing = Order.query.filter_by(checkout_key=key).first()
	if existing:
		if existing.user_id != user.id:
			return None, "Checkout key is already in use.", 409
		return existing, None, 200
	customer, error = parse_customer(data)
	if error:
		return None, error, 400
	method = None
	if method_value is not None:
		method, error = parse_method(method_value)
		if error:
			return None, error, 400

	items, error = parse_items(data)
	if error:
		return None, error, 400

	product_ids = [entry["product_id"] for entry in items]
	products = Product.query.filter(Product.id.in_(product_ids)).all()
	product_map = {product.id: product for product in products}

	if len(product_map) != len(set(product_ids)):
		return None, "One or more products were not found.", 404

	total = Decimal("0")
	order_items = []

	for entry in items:
		product = product_map[entry["product_id"]]

		if product.qty < entry["qty"]:
			return None, f'Insufficient stock for "{product.name}".', 400

		price = Decimal(str(product.price))
		subtotal = price * entry["qty"]
		total += subtotal

		order_items.append({
			"product": product,
			"product_name": product.name,
			"qty": entry["qty"],
			"price": price,
			"subtotal": subtotal,
			"stock_snapshot": product.qty,
		})

	order = Order(
		user_id=user.id,
		username=user.username,
		total_amount=total,
		status=OrderStatus.PENDING,
		checkout_key=key,
		**customer,
	)

	for entry in order_items:
		order.items.append(OrderItem(
			product_id=entry["product"].id,
			product_name=entry["product_name"],
			qty=entry["qty"],
			price=entry["price"],
			stock_snapshot=entry["stock_snapshot"],
			subtotal=entry["subtotal"],
		))

	db.session.add(order)
	try:
		db.session.flush()
		payment = None
		if method is not None:
			payment, error, _created = create_payment(order, user.id, method)
			if error:
				db.session.rollback()
				return None, error, 400
		db.session.commit()
	except IntegrityError:
		db.session.rollback()
		existing = Order.query.filter_by(checkout_key=key, user_id=user.id).first()
		if existing:
			return existing, None, 200
		raise
	notify_order(order)
	if payment:
		notify_order(order, payment)
	return order, None, 201
