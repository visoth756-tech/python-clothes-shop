from flask import Blueprint, render_template, request, redirect, url_for, flash, make_response
from app.services.home.cart import (
	get_cart,
	clear_cart,
	build_cart_items,
	cart_total_cents,
)
from app.services.home.order import (
	get_order,
	set_order,
	create_order_dict,
)
from data.products import format_price

checkout_bp = Blueprint("checkout", __name__)


@checkout_bp.route("/checkout")
def checkout():
	cart = get_cart()
	if not cart:
		flash("Your cart is empty.", "warning")
		return redirect(url_for("cart.cart_page"))
	items = build_cart_items(cart)
	total = cart_total_cents(items)
	return render_template(
		"home/checkout.html",
		items=items,
		total=format_price(total),
		total_cents=total,
	)


@checkout_bp.route("/checkout", methods=["POST"])
def checkout_submit():
	cart = get_cart()
	if not cart:
		return redirect(url_for("cart.cart_page"))
	
	items = build_cart_items(cart)
	total = cart_total_cents(items)
	
	order = create_order_dict(request.form, items, total)
	
	resp = make_response(redirect(url_for("checkout.payment")))
	set_order(resp, order)
	clear_cart(resp)
	return resp


@checkout_bp.route("/payment")
def payment():
	order = get_order()
	if not order:
		return redirect(url_for("main.index"))
	return render_template("home/payment.html", order=order)


@checkout_bp.route("/payment/confirm", methods=["POST"])
def payment_confirm():
	order = get_order()
	if not order:
		return redirect(url_for("main.index"))
	
	resp = make_response(redirect(url_for("orders.order_detail", order_id=order["id"])))
	set_order(resp, {**order, "paid": True})
	return resp
