from flask import render_template, request, jsonify

from app.extensions import db
from app.models import Order, Payment

from . import admin_bp, admin_payment_bp
from ..auth.decorators import admin_required
from ...services.payments import (
	create_payment,
	parse_method,
	serialize_payment,
)


@admin_bp.route("/payments")
@admin_required
def payments():
	return render_template(
		"admin/payments.html",
		title="Payments"
	)


@admin_payment_bp.route("", methods=["GET"], strict_slashes=False)
@admin_required
def api_list_payments():
	payments = Payment.query.order_by(Payment.created_at.desc()).all()
	return jsonify([serialize_payment(payment) for payment in payments])


@admin_payment_bp.route("/<string:payment_id>", methods=["GET"])
@admin_required
def api_get_payment(payment_id):
	payment = Payment.query.get(payment_id)

	if not payment:
		return jsonify({"errors": "Payment not found"}), 404

	return jsonify(serialize_payment(payment))


@admin_payment_bp.route("", methods=["POST"], strict_slashes=False)
@admin_required
def api_create_payment():
	data = request.get_json(silent=True) or {}

	order = Order.query.get(data.get("order_id"))

	if not order:
		return jsonify({"errors": "Order not found"}), 404

	method, error = parse_method(data.get("payment_method"))
	if error:
		return jsonify({"errors": error}), 400

	payment, error, created = create_payment(order, order.user_id, method)
	if error:
		return jsonify({"errors": error}), 400

	db.session.commit()

	return jsonify(serialize_payment(payment)), 201 if created else 200
