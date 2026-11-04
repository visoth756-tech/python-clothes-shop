from flask import Blueprint, g, jsonify, request

from ...models import Order
from ...services.orders import create_order, serialize_order
from ..auth.decorators import api_user_guard


api_order_bp = Blueprint("api_order", __name__, url_prefix="/api/orders")
api_order_bp.before_request(api_user_guard)


@api_order_bp.route("/me", methods=["GET"])
def my_orders():
	orders = (
		Order.query
		.filter_by(user_id=g.current_user.id)
		.order_by(Order.created_at.desc())
		.all()
	)
	return jsonify([serialize_order(order) for order in orders])


@api_order_bp.route("/<string:order_id>", methods=["GET"])
def get_order(order_id):
	order = Order.query.get(order_id)

	if not order:
		return jsonify({"errors": "Order not found"}), 404

	if not _can_view(order):
		return jsonify({"errors": "Forbidden"}), 403

	return jsonify(serialize_order(order))


@api_order_bp.route("", methods=["POST"], strict_slashes=False)
def create_order_endpoint():
	data = request.get_json(silent=True) or {}

	order, error, status = create_order(
		g.current_user,
		data,
		data.get("payment_method")
	)

	if error:
		return jsonify({"errors": error}), status

	return jsonify(serialize_order(order)), status


def _can_view(order):
	return (
		order.user_id == g.current_user.id
		or g.current_user.role.value == "ADMIN"
	)
