from flask import render_template, request, jsonify

from app.models import Order, User

from . import admin_bp, admin_order_bp
from ..auth.decorators import admin_required
from ...services.orders import create_order, serialize_order


@admin_bp.route("/orders")
@admin_required
def orders():
	return render_template(
		"admin/orders.html",
		title="Orders"
	)


@admin_order_bp.route("", methods=["GET"], strict_slashes=False)
@admin_required
def api_list_orders():
	orders = Order.query.order_by(Order.created_at.desc()).all()
	return jsonify([serialize_order(order) for order in orders])


@admin_order_bp.route("/<string:order_id>", methods=["GET"])
@admin_required
def api_get_order(order_id):
	order = Order.query.get(order_id)

	if not order:
		return jsonify({"errors": "Order not found"}), 404

	return jsonify(serialize_order(order))


@admin_order_bp.route("", methods=["POST"], strict_slashes=False)
@admin_required
def api_create_order():
	data = request.get_json(silent=True) or {}

	user = User.query.get(data.get("user_id"))

	if not user:
		return jsonify({"errors": "User not found"}), 404

	order, error, status = create_order(user, data, data.get("payment_method"))

	if error:
		return jsonify({"errors": error}), status

	return jsonify(serialize_order(order)), status
