from flask import Blueprint, render_template, request, redirect, url_for, flash, make_response, jsonify
from app.models import Product
from app.services.home.catalog import format_price
from app.services.home.cart import get_cart, set_cart, build_cart_items, cart_total_cents, cart_count

cart_bp = Blueprint("cart", __name__)

@cart_bp.route("/cart")
def cart_page():
    items = build_cart_items(get_cart())
    total = cart_total_cents(items)
    return render_template("home/cart.html", items=items, total=format_price(total), total_cents=total)


def add_item(data):
    product = Product.query.get(data.get("product_id")) if data.get("product_id") else None
    if not product:
        return None, "Product not found.", 404
    try:
        qty = int(data.get("qty", 1))
    except (TypeError, ValueError):
        return None, "Quantity must be a whole number.", 400
    if qty < 1:
        return None, "Quantity must be at least one.", 400
    cart = get_cart()
    entry = next((e for e in cart if e["id"] == product.id), None)
    new_qty = (entry["qty"] if entry else 0) + qty
    if new_qty > product.qty:
        return None, f"Only {product.qty} available for {product.name}.", 400
    if entry:
        entry["qty"] = new_qty
    else:
        cart.append({"id": product.id, "qty": qty})
    return cart, f'"{product.name}" added to cart.', 200

@cart_bp.route("/cart/add", methods=["POST"])
def cart_add():
    cart, message, status = add_item(request.form)
    flash(message, "success" if status == 200 else "danger")
    response = make_response(redirect(url_for("cart.cart_page")))
    return set_cart(response, cart) if cart is not None else response

@cart_bp.route("/api/cart/add", methods=["POST"])
def api_cart_add():
    cart, message, status = add_item(request.get_json(silent=True) or {})
    response = make_response(jsonify(success=status == 200, message=message, cart_count=cart_count(cart or [])), status)
    return set_cart(response, cart) if cart is not None else response

@cart_bp.route("/api/cart/update", methods=["POST"])
def cart_update():
    data = request.get_json(silent=True) or {}
    action = data.get("action")
    if action not in ("increase", "decrease", "remove"):
        return jsonify(message="Invalid cart action."), 400
    cart = get_cart()
    for entry in cart:
        if entry["id"] != data.get("product_id"):
            continue
        if action == "remove" or (action == "decrease" and entry["qty"] == 1):
            cart.remove(entry)
        elif action == "decrease":
            entry["qty"] -= 1
        else:
            product = Product.query.get(entry["id"])
            if entry["qty"] >= product.qty:
                return jsonify(message="No more stock available."), 400
            entry["qty"] += 1
        break
    items = build_cart_items(cart)
    response = make_response(jsonify(success=True, cart_count=cart_count(cart), total=format_price(cart_total_cents(items)), items=[{"id": i["id"], "qty": i["qty"], "subtotal": i["subtotal"]} for i in items]))
    return set_cart(response, cart)
