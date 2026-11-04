from flask import Blueprint, render_template, request, jsonify
from app.models import Product, Category
from app.services.home.catalog import catalog_query, product_data, format_price

products_bp = Blueprint("products", __name__)

@products_bp.route("/products")
def products_page():
    keyword = request.args.get("keyword", "").strip()
    search = request.args.get("search", "").strip()
    products = [product_data(p) for p in catalog_query(keyword, search).all()]
    categories = Category.query.order_by(Category.name).all()
    return render_template("home/products.html", products=products, keywords=[c.name for c in categories], active_keyword=keyword, search=search)

@products_bp.route("/api/products")
def api_products():
    return jsonify([product_data(p) for p in catalog_query(request.args.get("keyword", ""), request.args.get("search", "")).all()])

@products_bp.route("/products/<product_id>")
def product_detail(product_id):
    product = Product.query.get_or_404(product_id)
    related = Product.query.filter(Product.category_id == product.category_id, Product.id != product.id).limit(4).all()
    data = product_data(product)
    return render_template("home/product_detail.html", product=data, price=format_price(data["priceCents"]), related=[product_data(p) for p in related])
