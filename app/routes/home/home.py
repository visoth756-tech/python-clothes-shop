from flask import render_template

from app.routes.home import home_bp

@home_bp.route("/")
def index():
	return render_template("pages/home/index.html", title="Homepage")
