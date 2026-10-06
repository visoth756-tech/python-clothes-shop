from flask import Blueprint, session
from app.extensions import limiter
from app.extensions import get_remote_address

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")

admin_user_bp = Blueprint("admin_user", __name__, url_prefix="/admin/api/users")
admin_category_bp = Blueprint("admin_category", __name__, url_prefix="/admin/api/categories")
admin_product_bp = Blueprint("admin_product", __name__, url_prefix="/admin/api/products")
admin_order_bp = Blueprint("admin_order", __name__, url_prefix="/admin/api/orders")
admin_payment_bp = Blueprint("admin_payment", __name__, url_prefix="/admin/api/payments")
admin_error_log_bp = Blueprint("admin_error_log", __name__, url_prefix="/admin/api/error-logs")

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

from . import dashboard
from . import categories
from . import products
from . import orders
from . import payments
from . import users
from . import error_logs