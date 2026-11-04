from flask import Blueprint, render_template
from app.services.home.catalog import catalog_query, product_data

main_bp = Blueprint("main", __name__)

@main_bp.route("/")
def index():
    featured = [product_data(p) for p in catalog_query().limit(8).all()]
    return render_template("home/index.html", title="Homepage", products=featured)
