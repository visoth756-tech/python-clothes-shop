from ...services import bakong
from requests import RequestException
from flask import Blueprint, g, jsonify, request, make_response

from app.extensions import db

from ...models import Order, Payment
from ...services.payments import (
	check_payment_status,
	create_payment,
	parse_method,
	serialize_payment,
	fail_order,
	snapshot_warning,
)
from ..auth.decorators import api_user_guard


api_payment_bp = Blueprint("api_payment", __name__, url_prefix="/api/payments")
api_payment_bp.before_request(api_user_guard)


@api_payment_bp.route("/me", methods=["GET"])
def my_payments():
	payments = (
		Payment.query
		.filter_by(user_id=g.current_user.id)
		.order_by(Payment.created_at.desc())
		.all()
	)
	return jsonify([serialize_payment(payment) for payment in payments])


@api_payment_bp.route("/<string:payment_id>/status", methods=["GET"])
def payment_status(payment_id):
	payment = Payment.query.get(payment_id)

	if not payment:
		return jsonify({"errors": "Payment not found"}), 404

	if not _can_view(payment):
		return jsonify({"errors": "Forbidden"}), 403

	try:
		check_payment_status(payment)
	except (RequestException, ValueError, KeyError, TypeError):
		db.session.rollback()
		return jsonify(errors="Payment provider is unavailable. Please retry."), 502

	return jsonify(serialize_payment(payment))


@api_payment_bp.route("/<string:payment_id>", methods=["GET"])
def get_payment(payment_id):
	payment = Payment.query.get(payment_id)

	if not payment:
		return jsonify({"errors": "Payment not found"}), 404

	if not _can_view(payment):
		return jsonify({"errors": "Forbidden"}), 403

	return jsonify(serialize_payment(payment))


@api_payment_bp.route("", methods=["POST"], strict_slashes=False)
def create_payment_endpoint():
	data = request.get_json(silent=True) or {}

	order = Order.query.get(data.get("order_id"))

	if not order:
		return jsonify({"errors": "Order not found"}), 404

	if not _can_view(order):
		return jsonify({"errors": "Forbidden"}), 403

	method, error = parse_method(data.get("payment_method"))
	if error:
		return jsonify({"errors": error}), 400

	try:
		payment, error, created = create_payment(order, order.user_id, method)
	except (RequestException, ValueError, KeyError, TypeError):
		db.session.rollback()
		return jsonify(errors="Payment provider is unavailable. Please retry."), 502
	if error:
		db.session.commit()
		return jsonify({"errors": error}), 400

	db.session.commit()

	return jsonify(serialize_payment(payment)), 201 if created else 200


def _can_view(obj):
	return (
		obj.user_id == g.current_user.id
		or g.current_user.role.value == "ADMIN"
	)


@api_payment_bp.route("/<string:payment_id>/qr", methods=["GET"])
def payment_qr(payment_id):
    payment = Payment.query.get_or_404(payment_id)
    if not _can_view(payment):
        return jsonify(errors="Forbidden"), 403
    if payment.order.status.value == "FAILED":
        return jsonify(errors=payment.order.failure_reason or "Order failed"), 409
    if payment.order.status.value == "PENDING":
        warning = snapshot_warning(payment.order)
        if warning:
            fail_order(payment.order, warning)
            db.session.commit()
            return jsonify(errors=warning), 409
    
    try:
	    png_data = bakong.qr_png(payment.qr_data)
    except (ValueError, TypeError):
	    return jsonify(errors="Payment QR could not be rendered."), 502
    
    response = make_response(png_data)
    response.headers["Content-Type"] = "image/png"
    response.headers["Content-Length"] = str(len(png_data))
    response.headers["Cache-Control"] = "no-store"
    response.headers["Content-Disposition"] = 'inline; filename="khqr.png"'
    return response