from flask import Blueprint, render_template, session
from app.models import Order
from app.routes.auth.decorators import login_required
from app.services.home.order import owned_order, order_view

orders_bp = Blueprint("orders", __name__)

@orders_bp.route("/orders")
@login_required
def orders():
    orders = Order.query.filter_by(user_id=session["user_id"]).order_by(Order.created_at.desc()).all()
    return render_template("home/orders.html", orders=[order_view(o) for o in orders])

@orders_bp.route("/orders/<order_id>")
@login_required
def order_detail(order_id):
    return render_template("home/order_detail.html", order=order_view(owned_order(order_id)))
