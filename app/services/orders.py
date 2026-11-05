from datetime import UTC
from decimal import Decimal

from app.extensions import db
from app.models import Order, OrderItem, Product
from app.models.enums import OrderStatus

from .payments import create_payment, parse_method, serialize_payment


def serialize_order(order):
	return {
		"id": order.id,
		"userId": order.user_id,
		"username": order.username,
		"totalAmount": float(order.total_amount) if order.total_amount is not None else None,
		"status": order.status.value,
		"warning": order.failure_reason,
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

	items = []
	for entry in raw:
		if not isinstance(entry, dict):
			return None, "Each item must be an object."

		product_id = entry.get("product_id")

		if not product_id:
			return None, "Each item needs a product_id."

		try:
			qty = int(entry.get("qty", 1))
		except (TypeError, ValueError):
			return None, "Item qty must be a whole number."

		if qty < 1:
			return None, "Item qty must be at least 1."

		items.append({"product_id": product_id, "qty": qty})

	return items, None


def create_order(user, data, method_value):
	"""Create an order (and its payment) for a user.

	Returns (order, error, status_code).
	"""
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
	db.session.flush()

	payment, error, _created = create_payment(order, user.id, method)
	if error:
		db.session.rollback()
		return None, error, 400

	db.session.commit()

	return order, None, 201
