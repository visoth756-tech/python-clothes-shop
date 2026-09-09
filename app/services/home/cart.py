import json
from flask import request
from data.products import products, get_product_by_id, format_price


def get_cart():
	raw = request.cookies.get("cart")
	if not raw:
		return []
	try:
		cart = json.loads(raw)
	except (ValueError, TypeError):
		return []
	
	if not isinstance(cart, list):
		return []
	cleaned = []
	for entry in cart:
		if isinstance(entry, dict) and "id" in entry and "qty" in entry:
			try:
				entry["qty"] = int(entry["qty"])
			except (TypeError, ValueError):
				continue
			cleaned.append(entry)
	return cleaned


def set_cart(response, cart):
	response.set_cookie("cart", json.dumps(cart), max_age=60 * 60 * 24 * 7)
	return response


def clear_cart(response):
	response.delete_cookie("cart")
	return response


def build_cart_items(cart):
	items = []
	for entry in cart:
		product = get_product_by_id(products, entry["id"])
		if product:
			qty = entry["qty"]
			items.append({
				**product,
				"qty": qty,
				"subtotalCents": product["priceCents"] * qty,
				"subtotal": format_price(product["priceCents"] * qty),
				"price": format_price(product["priceCents"]),
			})
	return items


def cart_total_cents(cart_items):
	return sum(item["subtotalCents"] for item in cart_items)


def cart_count(cart):
	return sum(entry["qty"] for entry in cart)
