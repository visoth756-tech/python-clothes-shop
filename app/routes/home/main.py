from flask import Blueprint, render_template

from data import products

main_bp = Blueprint("main", __name__)


@main_bp.route("/")
def index():
	featured = products[:8]
	return render_template("home/index.html", title="Homepage", products=featured)


@main_bp.app_errorhandler(404)
def not_found(e):
	return render_template("errors/404.html"), 404
