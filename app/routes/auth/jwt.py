from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
	create_access_token, create_refresh_token, jwt_required,
	get_jwt_identity, get_jwt
)
from werkzeug.security import check_password_hash

from app.extensions import jwt
from app.models import User


jwt_bp = Blueprint(
	"jwt_auth",
	__name__,
	url_prefix="/api/auth"
)

# --- blocklist for revoked JTIs (in-memory demo) ---
REVOKED_JTIS = set()


@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_data):
	return jwt_data["jti"] in REVOKED_JTIS


def _user_payload(user):
	return {
		"id": user.id,
		"username": user.username,
		"role": user.role.value,
		"image": user.image,
	}


@jwt_bp.route("/login", methods=["POST"])
def login():
	data = request.get_json(silent=True) or {}
	username = (data.get("username") or "").strip()
	password = data.get("password") or ""

	user = User.query.filter_by(username=username).first()

	if not user or not check_password_hash(user.password, password):
		return jsonify({"msg": "Bad username or password"}), 401

	access = create_access_token(identity=user.id)
	refresh = create_refresh_token(identity=user.id)

	return jsonify(
		access_token=access,
		refresh_token=refresh,
		user=_user_payload(user)
	)


@jwt_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
	user_id = get_jwt_identity()
	return jsonify(access_token=create_access_token(identity=user_id))


@jwt_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
	REVOKED_JTIS.add(get_jwt()["jti"])
	return jsonify(msg="Access token revoked")


@jwt_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
	user = User.query.get(get_jwt_identity())

	if not user:
		return jsonify({"msg": "User not found"}), 404

	return jsonify(user=_user_payload(user))
