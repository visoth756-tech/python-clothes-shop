from flask import render_template, request, jsonify
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from app.extensions import db
from . import admin_bp, admin_category_bp
from ..auth.decorators import admin_required
from ...models import Category


def serialize_category(category):
	return {
		"id": category.id,
		"name": category.name,
		"created_at": category.created_at,
		"updated_at": category.updated_at,
	}


def validate_category_name(name, category_id=None):
	name = (name or "").strip().lower()
	
	if not name:
		return None, "Category name is required.", 400
	
	query = Category.query.filter(func.lower(Category.name) == name)
	
	if category_id:
		query = query.filter(Category.id != category_id)
	
	if query.first():
		return None, 'A category name already exists.', 409
	
	return name, None, None


@admin_bp.route("/categories", methods=["GET"])
@admin_required
def categories():
	return render_template(
		"pages/admin/categories.html",
		title="Categories"
	)


@admin_category_bp.route("/", methods=["GET"])
@admin_required
def api_list_categories():
	categories = Category.query.order_by(Category.name).all()
	return jsonify([serialize_category(c) for c in categories])


@admin_category_bp.route("/<string:category_id>", methods=["GET"])
@admin_required
def api_get_category(category_id):
	category = Category.query.get_or_404(category_id)
	return jsonify(serialize_category(category))


@admin_category_bp.route("/", methods=["POST"])
@admin_required
def api_create_category():
	data = request.get_json(silent=True) or {}
	name = (data.get("name") or "").strip().lower()
	
	name, error, status = validate_category_name(data.get("name"))
	
	if error:
		return jsonify({"error": error}), status
	
	category = Category(name=name)
	db.session.add(category)
	
	try:
		db.session.commit()
	except IntegrityError:
		db.session.rollback()
		return jsonify({"error": "A category with that name already exists."}), 409
	
	return jsonify(serialize_category(category)), 201


@admin_category_bp.route("/<string:category_id>", methods=["PUT"])
@admin_required
def api_update_category(category_id):
	category = Category.query.get_or_404(category_id)
	
	data = request.get_json(silent=True) or {}
	
	name, error, status = validate_category_name(
		data.get("name"),
		category_id
	)
	
	if error:
		return jsonify({"error": error}), status
	
	category.name = name
	
	try:
		db.session.commit()
	except IntegrityError:
		db.session.rollback()
		return jsonify({
			"error": f'A category named "{name}" already exists.'
		}), 409
	
	return jsonify(serialize_category(category))


@admin_category_bp.route("/<string:category_id>", methods=["DELETE"])
@admin_required
def api_delete_category(category_id):
	category = Category.query.get_or_404(category_id)
	db.session.delete(category)
	db.session.commit()
	return "", 204
