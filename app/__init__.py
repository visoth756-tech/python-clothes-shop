from datetime import timedelta
from flask import Flask, render_template, request
from flask_cors import CORS

from app.extensions import db, migrate, limiter, csrf
from app.config import DevelopmentConfig
from app.models import RateLimitLog, User
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
	
	CORS(
		app,
		origins=["http://127.0.0.1:5500", "http://localhost:5500"],
		supports_credentials=True
	)
	
	app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(minutes=1440)
	
	# Initialize extensions
	db.init_app(app)
	migrate.init_app(app, db)
	limiter.init_app(app)
	csrf.init_app(app)
	
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
	def too_many_requests(error):
		log = RateLimitLog(
			ip_address=request.remote_addr,
			endpoint=request.path,
			method=request.method,
			limit=str(error.description)
		)
		
		db.session.add(log)
		db.session.commit()
		
		send_telegram(
			"Rate Limit Triggered\n"
			f"IP: {request.remote_addr}\n"
			f"Endpoint: {request.path}\n"
			f"Method: {request.method}\n"
			f"Limit: {error.description}"
		)
		
		return render_template("errors/429.html"), 429
	
	@app.errorhandler(500)
	def internal_server_error(_error):
		return render_template("errors/500.html"), 500
	
	@app.route("/test-500")
	def test_500():
		raise Exception("Testing 500 error")
	
	return app
