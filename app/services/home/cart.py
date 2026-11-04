import json
from flask import request
from app.models import Product
from .catalog import product_data, format_price


def get_cart():
    try:
        cart = json.loads(request.cookies.get("cart", "[]"))
    except (ValueError, TypeError):
        return []
    if not isinstance(cart, list):
        return []
    quantities = {}
    for entry in cart:
        if not isinstance(entry, dict) or not isinstance(entry.get("id"), str):
            continue
        qty = entry.get("qty")
        if isinstance(qty, bool) or not isinstance(qty, int) or qty <= 0:
            continue
        quantities[entry["id"]] = min(999, quantities.get(entry["id"], 0) + qty)
    if not quantities:
        return []
    products = Product.query.filter(Product.id.in_(quantities)).all()
    return [{"id": p.id, "qty": quantities[p.id]} for p in products]


def set_cart(response, cart):
    response.set_cookie("cart", json.dumps(cart), max_age=60 * 60 * 24 * 7, httponly=True, samesite="Lax")
    return response


def clear_cart(response):
    response.delete_cookie("cart")
    return response


def build_cart_items(cart):
    products = {p.id: p for p in Product.query.filter(Product.id.in_([e["id"] for e in cart])).all()}
    items = []
    for entry in cart:
        product = products.get(entry["id"])
        if product:
            data = product_data(product)
            subtotal = data["priceCents"] * entry["qty"]
            items.append({**data, "qty": entry["qty"], "subtotalCents": subtotal, "subtotal": format_price(subtotal), "price": format_price(data["priceCents"])})
    return items


def cart_total_cents(items):
    return sum(item["subtotalCents"] for item in items)


def cart_count(cart):
    return sum(entry["qty"] for entry in cart)
