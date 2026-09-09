from flask import Blueprint, render_template, request, redirect, url_for, flash, make_response, jsonify
from data.products import products, get_product_by_id, format_price
from app.services.home.cart import (
	get_cart,
	set_cart,
	build_cart_items,
	cart_total_cents,
	cart_count,
)

cart_bp = Blueprint("cart", __name__)


@cart_bp.route("/cart")
def cart_page():
	cart = get_cart()
	items = build_cart_items(cart)
	total = cart_total_cents(items)
	return render_template(
		"home/cart.html",
		items=items,
		total=format_price(total),
		total_cents=total,
	)


@cart_bp.route("/cart/add", methods=["POST"])
def cart_add():
	product_id = request.form.get("product_id")
	try:
		qty = int(request.form.get("qty", 1) or 1)
	except (TypeError, ValueError):
		qty = 1
	if qty < 1:
		qty = 1
	product = get_product_by_id(products, product_id)
	if not product:
		flash("Product not found.", "danger")
		return redirect(request.referrer or url_for("products.products_page"))
	
	cart = get_cart()
	for entry in cart:
		if entry["id"] == product_id:
			entry["qty"] += qty
			break
	else:
		cart.append({"id": product_id, "qty": qty})
	
	flash(f'"{product["name"]}" added to cart.', "success")
	resp = make_response(redirect(request.referrer or url_for("products.products_page")))
	set_cart(resp, cart)
	return resp


@cart_bp.route("/api/cart/add", methods=["POST"])
def api_cart_add():
	data = request.get_json() or {}
	product_id = data.get("product_id")
	try:
		qty = int(data.get("qty", 1) or 1)
	except (TypeError, ValueError):
		qty = 1
	if qty < 1:
		qty = 1
	product = get_product_by_id(products, product_id)
	if not product:
		return jsonify({"success": False, "message": "Product not found."}), 404
	
	cart = get_cart()
	for entry in cart:
		if entry["id"] == product_id:
			entry["qty"] += qty
			break
	else:
		cart.append({"id": product_id, "qty": qty})
	
	resp = make_response(jsonify({
		"success": True,
		"cart_count": cart_count(cart),
		"message": f'"{product["name"]}" added to cart.',
	}))
	set_cart(resp, cart)
	return resp


@cart_bp.route("/api/cart/update", methods=["POST"])
def cart_update():
	data = request.get_json() or {}
	product_id = data.get("product_id")
	action = data.get("action")  # "increase" | "decrease" | "remove"
	
	cart = get_cart()
	for entry in cart:
		if entry["id"] == product_id:
			if action == "increase":
				entry["qty"] += 1
			elif action == "decrease":
				entry["qty"] -= 1
				if entry["qty"] <= 0:
					cart.remove(entry)
			elif action == "remove":
				cart.remove(entry)
			break
	
	items = build_cart_items(cart)
	total = cart_total_cents(items)
	
	resp = make_response(jsonify({
		"success": True,
		"cart_count": cart_count(cart),
		"total": format_price(total),
		"items": [
			{
				"id": item["id"],
				"qty": item["qty"],
				"subtotal": item["subtotal"],
			}
			for item in items
		],
	}))
	set_cart(resp, cart)
	return resp
