from flask import Blueprint, render_template, request, redirect, url_for, flash, make_response, session
from requests import RequestException
from app.extensions import db
from app.models import User
from app.routes.auth.decorators import login_required
from app.services.home.cart import get_cart, clear_cart, build_cart_items, cart_total_cents
from app.services.home.catalog import format_price
from app.services.home.order import owned_order, order_view
from app.services.orders import create_order

checkout_bp = Blueprint("checkout", __name__)

@checkout_bp.route("/checkout")
@login_required
def checkout():
    items = build_cart_items(get_cart())
    if not items:
        flash("Your cart is empty.", "warning")
        return redirect(url_for("cart.cart_page"))
    return render_template("home/checkout.html", items=items, total=format_price(cart_total_cents(items)))

@checkout_bp.route("/checkout", methods=["POST"])
@login_required
def checkout_submit():
    user = db.session.get(User, session["user_id"])
    if not user:
        return redirect(url_for("auth.login"))
    data = {"items": [{"product_id": e["id"], "qty": e["qty"]} for e in get_cart()]}
    try:
        order, error, status = create_order(user, data, request.form.get("payment_method"))
    except (RequestException, ValueError, KeyError, TypeError):
        db.session.rollback()
        flash("Payment provider is unavailable. Your cart is saved; please retry.", "danger")
        return redirect(url_for("checkout.checkout"))
    if error:
        flash(error, "danger")
        return redirect(url_for("checkout.checkout"))
    response = make_response(redirect(url_for("checkout.payment", order_id=order.id)))
    clear_cart(response)
    return response

@checkout_bp.route("/payment")
@login_required
def payment():
    order_id = request.args.get("order_id")
    if not order_id:
        return redirect(url_for("orders.orders"))
    order = owned_order(order_id)
    return render_template("home/payment.html", order=order_view(order))
