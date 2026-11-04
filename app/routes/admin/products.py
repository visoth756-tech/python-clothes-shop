from sqlalchemy.exc import IntegrityError
from flask import render_template, jsonify, request
from sqlalchemy import func

from . import admin_product_bp, admin_bp
from .utils import save_product_image, delete_product_image
from ..auth.decorators import admin_required
from app.extensions import db
from ...models import Product, Category


def serialize_product(p):
	return {
		"id": p.id,
		"name": p.name,
		"description": p.description,
		"price": p.price,
		"qty": p.qty,
		"category_id": p.category_id,
		"image": p.image,
		"created_at": p.created_at,
		"updated_at": p.updated_at,
	}


def _parse_price_qty(data):
	try:
		price = float(data.get("price", 0))
	except (TypeError, ValueError):
		return None, None, "Product price must be a number"
	
	try:
		qty = int(data.get("qty", 0))
	except (TypeError, ValueError):
		return None, None, "Product qty must be a whole number"
	
	if price <= 0:
		return None, None, "Product price required"
	
	if qty < 0:
		return None, None, "Product qty must be zero or greater"
	
	return price, qty, None


def _validate_product_name(name, product_id=None):
	name = (name or "").strip().lower()
	
	if not name:
		return None, "Product name required", 400
	
	query = Product.query.filter(func.lower(Product.name) == name)
	
	if product_id:
		query = query.filter(Product.id != product_id)
	
	if query.first():
		return None, "Product name already exists", 409
	
	return name, None, None


def _parse_description(data):
	description = (data.get("description") or "").strip()

	if len(description) > Product.DESCRIPTION_MAX_LENGTH:
		return None, f"Product description must be {Product.DESCRIPTION_MAX_LENGTH} characters or less"

	return description, None


def _validate_category(category_id):
	if not category_id:
		return None, "Category id required", 400
	
	category = Category.query.get(category_id)
	
	if not category:
		return None, "Category id not found", 400
	
	return category, None, None


# /admin/product
@admin_bp.route("/products")
@admin_required
def products():
	return render_template(
		"admin/products.html",
		title="Products",
		description_max_length=Product.DESCRIPTION_MAX_LENGTH
	)


# /admin/api/products
@admin_product_bp.route("", methods=["GET"])
@admin_required
def get_products():
	products = Product.query.all()
	return jsonify([serialize_product(p) for p in products]), 200


@admin_product_bp.route("/<string:product_id>", methods=["GET"])
@admin_required
def get_product_by_id(product_id):
	product = Product.query.get(product_id)
	if not product:
		return jsonify({"errors": "Product not found"}), 404
	return jsonify(serialize_product(product)), 200


@admin_product_bp.route("", methods=["POST"])
@admin_required
def create_product():
	data = request.form
	
	name, error, status = _validate_product_name(data.get("name"))
	if error:
		return jsonify({"errors": error}), status
	
	category, error, status = _validate_category(data.get("category_id"))
	if error:
		return jsonify({"errors": error}), status

	description, error = _parse_description(data)
	if error:
		return jsonify({"errors": error}), 400

	price, qty, error = _parse_price_qty(data)
	if error:
		return jsonify({"errors": error}), 400

	try:
		image_path = save_product_image(request.files.get("image"))
	except ValueError as e:
		return jsonify({"errors": str(e)}), 400

	product = Product(
		name=name,
		description=description,
		price=price,
		qty=qty,
		category_id=category.id,
		image=image_path,
	)
	
	db.session.add(product)
	
	try:
		db.session.commit()
	except IntegrityError:
		db.session.rollback()
		return jsonify({"errors": "Product name already exists"}), 409
	
	return jsonify(serialize_product(product)), 201


@admin_product_bp.route("/<string:product_id>", methods=["PUT", "PATCH"])
@admin_required
def update_product(product_id):
	product = Product.query.get(product_id)
	
	if not product:
		return jsonify({"errors": "Product not found"}), 404
	
	data = request.form
	
	name, error, status = _validate_product_name(
		data.get("name"),
		product.id
	)
	if error:
		return jsonify({"errors": error}), status
	
	category, error, status = _validate_category(data.get("category_id"))
	if error:
		return jsonify({"errors": error}), status

	description, error = _parse_description(data)
	if error:
		return jsonify({"errors": error}), 400

	price, qty, error = _parse_price_qty(data)
	if error:
		return jsonify({"errors": error}), 400

	if request.files.get("image"):
		try:
			product.image = save_product_image(
				request.files.get("image"),
				old_image=product.image
			)
		except ValueError as e:
			return jsonify({"errors": str(e)}), 400
	
	product.name = name
	if "description" in data:
		product.description = description
	product.price = price
	product.qty = qty
	product.category_id = category.id
	
	try:
		db.session.commit()
	except IntegrityError:
		db.session.rollback()
		return jsonify({"errors": "Product name already exists"}), 409
	
	return jsonify(serialize_product(product)), 200


@admin_product_bp.route("/<string:product_id>", methods=["DELETE"])
@admin_required
def delete_product(product_id):
	product = Product.query.get(product_id)
	if not product:
		return jsonify({"errors": "Product not found"}), 404
	
	if product.qty > 0:
		return jsonify({"errors": "Product still has stock"}), 400
	
	delete_product_image(product.image)
	
	db.session.delete(product)
	db.session.commit()
	return jsonify({"message": "Product deleted successfully"}), 200
