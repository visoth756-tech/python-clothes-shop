from .admin import admin_bp, admin_user_bp, admin_product_bp, admin_category_bp, admin_error_log_bp, admin_order_bp, \
	admin_payment_bp
from .auth import auth_bp
from .home import home_bp
from .home.cart import cart_bp
from .home.checkout import checkout_bp
from .home.main import main_bp
from .home.orders import orders_bp
from .home.products import products_bp


def register_routes(app):
	app.register_blueprint(admin_bp)
	app.register_blueprint(admin_user_bp)
	app.register_blueprint(admin_category_bp)
	app.register_blueprint(admin_product_bp)
	app.register_blueprint(admin_error_log_bp)
	
	app.register_blueprint(auth_bp)
	
	app.register_blueprint(home_bp)
	app.register_blueprint(main_bp)
	app.register_blueprint(cart_bp)
	app.register_blueprint(checkout_bp)
	app.register_blueprint(orders_bp)
	app.register_blueprint(products_bp)
