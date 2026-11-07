from flask import request, jsonify, render_template, g
from werkzeug.security import generate_password_hash

from app.extensions import db
from app.models import User
from . import admin_bp, admin_user_bp
from .utils import save_user_image, delete_user_image, get_thumb_filename
from ..auth.decorators import admin_required
from ...models.enums import Role, UserStatus


def serialize_user(user: User) -> dict:
  return {
   "id": user.id,
   "is_current_user": str(user.id) == str(g.admin_user_id),
   "image": user.image,
   "image_thumb": get_thumb_filename(user.image),
   "username": user.username,
   "role": user.role.value,
   "status": user.status.value,
   "created_at": user.created_at.isoformat() if user.created_at else None,
   "updated_at": user.updated_at.isoformat() if user.updated_at else None,
  }


@admin_bp.route("/users")
@admin_required
def users():
  return render_template("admin/users.html", title="Users")


@admin_user_bp.route("", methods=["GET"])
def get_users():
  users = User.query.all()
  return jsonify([serialize_user(u) for u in users]), 200


@admin_user_bp.route("/<string:user_id>", methods=["GET"])
def get_user_by_id(user_id):
  user = User.query.get(user_id)
  if not user:
   return jsonify({"errors": "User not found"}), 404
  return jsonify(serialize_user(user)), 200


@admin_user_bp.route("", methods=["POST"])
def create_user():
  data = request.form

  username = (data.get("username") or "").strip()
  password = data.get("password") or ""
  role = data.get("role", Role.USER.value)
  status = data.get("status", UserStatus.ACTIVE.value)

  if not username:
   return jsonify({"errors": "username is required"}), 400
  if not password:
   return jsonify({"errors": "password is required"}), 400

  if User.query.filter_by(username=username).first():
   return jsonify({"errors": "username already taken"}), 409

  try:
   role = Role(role)
   status = UserStatus(status)
  except ValueError:
   return jsonify({"errors": "invalid role or status"}), 400

  try:
   image_path = save_user_image(request.files.get("image"))
  except ValueError as e:
   return jsonify({"errors": str(e)}), 400

  user = User(
   username=username,
   password=generate_password_hash(password),
   image=image_path,
   role=role,
   status=status,
  )

  db.session.add(user)
  db.session.commit()

  return jsonify(serialize_user(user)), 201


@admin_user_bp.route("/<string:user_id>", methods=["PUT", "PATCH"])
def update_user(user_id):
  user = User.query.get(user_id)
  if not user:
   return jsonify({"errors": "User not found"}), 404

  data = request.form

  if str(user.id) == str(g.admin_user_id) and (
   "role" in data and data["role"] != user.role.value
  ):
   return jsonify({"errors": "You cannot change your own account role."}), 403

  if str(user.id) == str(g.admin_user_id) and (
   "status" in data and data["status"] != user.status.value
  ):
   return jsonify({"errors": "You cannot change your own account status."}), 403

  if "username" in data:
   new_username = data["username"].strip()
   if not new_username:
    return jsonify({"errors": "username cannot be blank"}), 400
   existing = User.query.filter_by(username=new_username).first()
   if existing and existing.id != user.id:
    return jsonify({"errors": "username already taken"}), 409
   user.username = new_username

  if data.get("password"):
   user.password = generate_password_hash(data["password"])

  if "role" in data:
   try:
    user.role = Role(data["role"])
   except ValueError:
    return jsonify({"errors": "invalid role"}), 400

  if "status" in data:
   try:
    user.status = UserStatus(data["status"])
   except ValueError:
    return jsonify({"errors": "invalid status"}), 400

  if request.files.get("image"):
   try:
    user.image = save_user_image(request.files.get("image"), old_image=user.image)
   except ValueError as e:
    return jsonify({"errors": str(e)}), 400

  if not request.files.get("image") and data.get("remove_image") == "1":
   user.image = None

  db.session.commit()
  return jsonify(serialize_user(user)), 200


@admin_user_bp.route("/<string:user_id>", methods=["DELETE"])
def delete_user(user_id):
  user = User.query.get(user_id)
  if not user:
   return jsonify({"errors": "User not found"}), 404

  if str(user.id) == str(g.admin_user_id):
   return jsonify({"errors": "You cannot delete your own account."}), 403

  if user.role == Role.ADMIN:
   return jsonify({"errors": "Admin users cannot be deleted"}), 403

  delete_user_image(user.image)

  db.session.delete(user)
  db.session.commit()
  return jsonify({"message": "User deleted successfully"}), 200
