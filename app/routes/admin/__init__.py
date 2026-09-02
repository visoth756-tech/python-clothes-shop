from flask import Blueprint

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")

admin_user_bp = Blueprint("admin_user", __name__, url_prefix="/admin/api/users")
admin_category_bp = Blueprint("admin_category", __name__, url_prefix="/admin/api/categories")
admin_product_bp = Blueprint("admin_product", __name__, url_prefix="/admin/api/products")
admin_order_bp = Blueprint("admin_order", __name__, url_prefix="/admin/api/orders")
admin_payment_bp = Blueprint("admin_payment", __name__, url_prefix="/admin/api/payments")

from . import dashboard
from . import categories
from . import products
from . import orders
from . import payments
from . import users
