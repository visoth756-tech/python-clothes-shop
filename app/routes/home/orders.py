from flask import Blueprint, render_template
from app.services.home.order import get_order

orders_bp = Blueprint("orders", __name__)


@orders_bp.route("/orders")
def orders():
	order = get_order()
	order_list = [order] if order else []
	return render_template("home/orders.html", orders=order_list)


@orders_bp.route("/orders/<order_id>")
def order_detail(order_id):
	order = get_order()
	if not order or order.get("id") != order_id:
		return render_template("errors/404.html"), 404
	return render_template("home/order_detail.html", order=order)
