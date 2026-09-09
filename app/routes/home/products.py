from flask import Blueprint, render_template, request
from data.products import (
	products,
	get_product_by_id,
	get_related_products,
	get_all_keywords,
	filter_products,
	format_price,
)

products_bp = Blueprint("products", __name__)


@products_bp.route("/products")
def products_page():
	keyword = request.args.get("keyword", "").strip()
	search = request.args.get("search", "").strip()
	filtered = filter_products(products, keyword=keyword or None, search=search or None)
	keywords = get_all_keywords(products)
	return render_template(
		"home/products.html",
		products=filtered,
		keywords=keywords,
		active_keyword=keyword,
		search=search,
	)


@products_bp.route("/products/<product_id>")
def product_detail(product_id):
	product = get_product_by_id(products, product_id)
	if not product:
		return render_template("home/404.html"), 404
	related = get_related_products(products, product)
	return render_template(
		"home/product_detail.html",
		product=product,
		price=format_price(product["priceCents"]),
		related=related,
	)
