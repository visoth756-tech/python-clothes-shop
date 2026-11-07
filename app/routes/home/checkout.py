from flask import Blueprint, render_template, request, redirect, url_for, flash, make_response, session, current_app
from flask_wtf.csrf import CSRFError
from uuid import uuid4
from requests import RequestException
from app.extensions import db
from app.models import User, Order
from app.routes.auth.decorators import login_required
from app.services.home.cart import get_cart, clear_cart, build_cart_items, cart_total_cents
from app.services.home.catalog import format_price
from app.services.home.order import owned_order, order_view
from app.services.orders import create_order

checkout_bp = Blueprint("checkout", __name__)


@checkout_bp.after_request
def private_checkout_response(response):
    response.headers["Cache-Control"] = "no-store"
    return response


def render_checkout(values=None, error=None, status=200):
    items = build_cart_items(get_cart())
    if not items:
        flash("Your cart is empty.", "warning")
        return redirect(url_for("cart.cart_page"))
    key = session.get("checkout_key")
    if not key or Order.query.filter_by(checkout_key=key).first():
        key = session["checkout_key"] = uuid4().hex
    return render_template("home/checkout.html", items=items,
                           total=format_price(cart_total_cents(items)), checkout_key=key,
                           values=values or {}, error=error), status


@checkout_bp.errorhandler(CSRFError)
def checkout_csrf_error(error):
    current_app.logger.warning("Checkout CSRF validation failed: %s", error.description)
    if not session.get("user_id"):
        flash("Your session expired. Please sign in and try checkout again.", "warning")
        return redirect(url_for("auth.login", next=url_for("checkout.checkout")))
    return render_checkout(request.form,
                           "Your checkout security token expired or is invalid. Your details are kept below; please submit again.", 400)


@checkout_bp.route("/checkout")
@login_required
def checkout():
    return render_checkout()

@checkout_bp.route("/checkout", methods=["POST"])
@login_required
def checkout_submit():
    user = db.session.get(User, session["user_id"])
    if not user:
        return redirect(url_for("auth.login"))
    key = request.form.get("checkout_key")
    existing = Order.query.filter_by(checkout_key=key, user_id=user.id).first() if key else None
    if existing:
        # A replay may arrive after the customer has started a new cart.
        return redirect(url_for("checkout.payment", order_id=existing.id))
    if not key or key != session.get("checkout_key"):
        return render_checkout(request.form, "Checkout expired. Please review and submit again.", 400)
    data = {**request.form, "items": [{"product_id": e["id"], "qty": e["qty"]} for e in get_cart()]}
    try:
        order, error, status = create_order(user, data)
    except (RequestException, ValueError, KeyError, TypeError):
        db.session.rollback()
        return render_checkout(request.form, "Could not create your order. Your cart is saved; please retry.", 503)
    if error:
        return render_checkout(request.form, error, status)
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
    if order.status.value == "CONFIRMED" and any(p.status.value == "PAID" for p in order.payments):
        return redirect(url_for("checkout.confirmation", order_id=order.id))
    return render_template("home/payment.html", order=order_view(order))


@checkout_bp.route("/orders/<order_id>/confirmation")
@login_required
def confirmation(order_id):
    order = owned_order(order_id)
    if order.status.value != "CONFIRMED" or not any(p.status.value == "PAID" for p in order.payments):
        return redirect(url_for("checkout.payment", order_id=order.id))
    return render_template("home/confirmation.html", order=order_view(order))
