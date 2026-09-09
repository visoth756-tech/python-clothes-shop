from datetime import timedelta

from flask import Flask, redirect, url_for

from app.extensions import db, migrate
from app.config import DevelopmentConfig
from app.routes import register_routes
from app.services.home.cart import get_cart, cart_count
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

    # Register routes
    register_routes(app)

    # Homepage
    # @app.route("/")
    # def index():
    #     return redirect(url_for("auth.login"))

    # Context processors
    @app.context_processor
    def inject_cart():
        cart = get_cart()

        return {
            "cart_count": cart_count(cart),
            "format_price": format_price,
        }

    return app