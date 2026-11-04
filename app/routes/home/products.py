from flask import Blueprint, render_template, request, jsonify, url_for
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


@products_bp.route("/api/products")  # test CORS
def api_products():
	keyword = request.args.get("keyword", "").strip()
	search = request.args.get("search", "").strip()
	filtered = filter_products(products, keyword=keyword or None, search=search or None)
	result = [
		{**p, "imageUrl": url_for("static", filename=f"img/{p['image']}", _external=True)}
		for p in filtered
	]
	return jsonify(result)


@products_bp.route("/products/<product_id>")
def product_detail(product_id):
	product = get_product_by_id(products, product_id)
	if not product:
		return render_template("errors/404.html"), 404
	related = get_related_products(products, product)
	return render_template(
		"home/product_detail.html",
		product=product,
		price=format_price(product["priceCents"]),
		related=related,
	)
