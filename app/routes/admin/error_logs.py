from flask import render_template, jsonify

from . import admin_bp, admin_error_log_bp
from ..auth.decorators import admin_required
from ... import RateLimitLog


def serialize_error_log(log):
	return {
		"id": log.id,
		"ip_address": log.ip_address,
		"endpoint": log.endpoint,
		"method": log.method,
		"limit": log.limit,
		"timestamp": log.timestamp
	}


@admin_bp.route("/error-logs")
@admin_required
def error_logs():
	return render_template(
		"admin/error_logs.html",
		title="Error Logs"
	)


@admin_error_log_bp.route("", methods=["GET"], strict_slashes=False)
@admin_required
def get_error_logs():
	logs = RateLimitLog.query.order_by(RateLimitLog.timestamp.desc()).all()
	return jsonify([serialize_error_log(log) for log in logs]), 200
