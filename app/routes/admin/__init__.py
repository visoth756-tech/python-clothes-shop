from collections import deque
from math import ceil
from threading import Lock
from time import monotonic

from flask import Blueprint, abort, current_app, g, request, session
from app.extensions import limiter
from app.extensions import get_remote_address
from ..auth.decorators import admin_api_guard

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")

admin_user_bp = Blueprint("admin_user", __name__, url_prefix="/admin/api/users")
admin_category_bp = Blueprint("admin_category", __name__, url_prefix="/admin/api/categories")
admin_product_bp = Blueprint("admin_product", __name__, url_prefix="/admin/api/products")
admin_order_bp = Blueprint("admin_order", __name__, url_prefix="/admin/api/orders")
admin_payment_bp = Blueprint("admin_payment", __name__, url_prefix="/admin/api/payments")
admin_error_log_bp = Blueprint("admin_error_log", __name__, url_prefix="/admin/api/error-logs")


@admin_bp.before_request
def limit_dashboard_refreshes():
	if request.method != "GET":
		return
	g.pop("dashboard_retry_after", None)
	g.pop("dashboard_limit_new", None)
	state = current_app.extensions.setdefault(
		"dashboard_refresh_limit", {"clients": {}, "lock": Lock()}
	)
	now = monotonic()
	with state["lock"]:
		clients = state["clients"]
		for key, value in list(clients.items()):
			if max(value["blocked_until"], value["last_seen"] + 60) <= now:
				del clients[key]
		# Keep the same key after session.clear(), including both dashboard URLs.
		key = get_remote_address()
		client = clients.get(key)
		if client and client["blocked_until"] > now:
			g.dashboard_retry_after = ceil(client["blocked_until"] - now)
			g.dashboard_limit_new = False
		elif session.get("user_id") and session.get("role") == "ADMIN":
			client = clients.setdefault(key, {
				"requests": deque(), "blocked_until": 0, "last_seen": now
			})
			client["last_seen"] = now
			while client["requests"] and client["requests"][0] <= now - 60:
				client["requests"].popleft()
			client["requests"].append(now)
			if len(client["requests"]) > 10:
				client["blocked_until"] = now + 60
				client["requests"].clear()
				g.dashboard_retry_after = 60
				g.dashboard_limit_new = True
	if getattr(g, "dashboard_retry_after", None):
		abort(429, description="10 admin page requests per minute")

def admin_user_key():
	user_id = session.get("user_id")
	
	if user_id:
		return f"admin_user:{user_id}"
	
	return f"admin_ip:{get_remote_address()}"


for bp in [
	admin_user_bp,
	admin_category_bp,
	admin_product_bp,
	admin_order_bp,
	admin_payment_bp,
	admin_error_log_bp
]:
	limiter.limit(
		"10 per minute",
		key_func=admin_user_key
	)(bp)
	bp.before_request(admin_api_guard)

from . import dashboard
from . import categories
from . import products
from . import orders
from . import payments
from . import users
from . import error_logs
