from datetime import timedelta
from flask import Flask, render_template
from app.extensions import db, migrate, limiter
from app.config import DevelopmentConfig
from app.routes import register_routes
from app.services.home.cart import get_cart, cart_count
from app.services.telegram import send_telegram
from data import format_price


def create_app(config_class=DevelopmentConfig):
	app = Flask(
		__name__,
		template_folder="../templates",
		static_folder="../static",
	)
	
	app.config.from_object(config_class)
	
	app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(minutes=1440)
	
	# Initialize extensions
	db.init_app(app)
	migrate.init_app(app, db)
	limiter.init_app(app)
	
	# Register routes
	register_routes(app)
	
	# Context processors
	@app.context_processor
	def inject_cart():
		cart = get_cart()
		
		return {
			"cart_count": cart_count(cart),
			"format_price": format_price,
		}
	
	# Error handlers
	@app.errorhandler(404)
	def page_not_found(_error):
		return render_template("errors/404.html"), 404
	
	@app.errorhandler(429)
	def too_many_requests(_error):
		send_telegram(
			"Rate Limit Triggered\n"
			"Someone exceeded the request limit."
		)
		
		return render_template("errors/429.html"), 429
	
	@app.errorhandler(500)
	def internal_server_error(_error):
		return render_template("errors/500.html"), 500
	
	@app.route("/test-500")
	def test_500():
		raise Exception("Testing 500 error")
	
	return app
