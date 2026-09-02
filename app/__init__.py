from datetime import timedelta

from flask import Flask, redirect, url_for
from app.extensions import db, migrate
from app.config import DevelopmentConfig
from app.routes import register_routes


def create_app():
	app = Flask(__name__, template_folder="../templates", static_folder="../static")
	app.config["SECRET_KEY"] = "change-this"
	app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(minutes=1440)
	
	app.config.from_object(DevelopmentConfig)
	
	db.init_app(app)
	migrate.init_app(app, db)
	
	@app.route("/")
	def index():
		return redirect(url_for("auth.login"))
	
	register_routes(app)
	
	return app
