from datetime import timedelta
from math import ceil
from threading import Lock
from time import time
from flask import Flask, g, jsonify, make_response, render_template, request, session
from dotenv import load_dotenv

load_dotenv()

from app.extensions import db, migrate, limiter, csrf, jwt
from app.config import ProductionConfig
from app.models import RateLimitLog, User
from app.routes import register_routes
from app.routes.auth import jwt_bp
from app.services.home.cart import get_cart, cart_count
from app.services.telegram import send_telegram
from app.services.home.catalog import format_price
from app.services.auth import invalidate_login
from app.routes.home.api_orders import api_order_bp
from app.routes.home.api_payments import api_payment_bp

def create_app(config_class=ProductionConfig):
	app = Flask(
		__name__,
		template_folder="../templates",
		static_folder="../static",
	)
	
	app.config.from_object(config_class)
	
	# CORS(
	# 	app,
	# 	origins=["http://127.0.0.1:5500", "http://localhost:5500"],
	# 	supports_credentials=True
	# )
	
	app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(minutes=1440)
	
	db.init_app(app)
	migrate.init_app(app, db)
	limiter.init_app(app)
	csrf.init_app(app)
	jwt.init_app(app)

	csrf.exempt(jwt_bp)

	csrf.exempt(api_order_bp)
	csrf.exempt(api_payment_bp)
	
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
	login_alerts = {}
	login_alert_lock = Lock()

	@app.errorhandler(404)
	def page_not_found(_error):
		return render_template("errors/404.html"), 404
	
	@app.errorhandler(429)
	def too_many_requests(error):
		dashboard_limited = request.blueprint == "admin"
		login_limited = request.endpoint in {"jwt_auth.login", "auth.login"}
		notify = not dashboard_limited or getattr(g, "dashboard_limit_new", True)
		if login_limited:
			now = time()
			limit = limiter.current_limit
			reset_at = limit.reset_at if limit else now + 60
			retry_after = max(1, ceil(reset_at - now))
			with login_alert_lock:
				for key, expiry in list(login_alerts.items()):
					if expiry <= now:
						del login_alerts[key]
				key = (request.endpoint, request.remote_addr)
				notify = key not in login_alerts
				login_alerts[key] = reset_at
		if dashboard_limited:
			user = db.session.get(User, session.get("user_id")) if session.get("user_id") else None
			if user:
				invalidate_login(user)
				db.session.commit()
			session.clear()
		# Notify once per dashboard lockout, not on every blocked refresh.
		if notify:
			try:
				log = RateLimitLog(
					ip_address=request.remote_addr,
					endpoint=request.path,
					method=request.method,
					limit=str(error.description)
				)
				db.session.add(log)
				db.session.commit()
			except Exception:
				db.session.rollback()
				app.logger.exception("Could not save rate-limit log")
			try:
				send_telegram(
					"Rate Limit Triggered\n"
					f"IP: {request.remote_addr}\n"
					f"Endpoint: {request.path}\n"
					f"Method: {request.method}\n"
					f"Limit: {error.description}"
				)
			except Exception:
				app.logger.exception("Could not send rate-limit Telegram message")
		if request.endpoint == "jwt_auth.login":
			response = jsonify(msg="Too many failed login attempts. Please wait before trying again.", retry_after=retry_after)
			response.status_code = 429
			response.headers["Cache-Control"] = "no-store"
			response.headers["Retry-After"] = str(retry_after)
			return response
		response = make_response(render_template(
			"errors/429.html",
			dashboard_limited=dashboard_limited,
			retry_after=getattr(g, "dashboard_retry_after", 60),
		), 429)
		response.headers["Cache-Control"] = "no-store"
		if dashboard_limited:
			response.headers["Retry-After"] = str(getattr(g, "dashboard_retry_after", 60))
		return response
	
	@app.errorhandler(500)
	def internal_server_error(_error):
		return render_template("errors/500.html"), 500
	
	@app.route("/test-500")
	def test_500():
		raise Exception("Testing 500 error")
	
	return app
