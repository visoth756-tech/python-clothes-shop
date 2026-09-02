from .admin import admin_bp, admin_user_bp, admin_product_bp, admin_category_bp
from .auth import auth_bp
from .home import home_bp


def register_routes(app):
	app.register_blueprint(admin_bp)
	app.register_blueprint(admin_user_bp)
	app.register_blueprint(admin_category_bp)
	app.register_blueprint(admin_product_bp)
	
	app.register_blueprint(auth_bp)
	
	app.register_blueprint(home_bp)