from functools import wraps
from flask import session, redirect, url_for, flash, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.models import User
from app.models.enums import Role


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not session.get("user_id"):
            flash("Please log in first.")
            return redirect(url_for("auth.login", next=request.path))
        return view(*args, **kwargs)
    return wrapped


def admin_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not session.get("user_id"):
            flash("Please log in first.")
            return redirect(url_for("auth.login", next=request.path))
        if session.get("role") != "ADMIN":
            flash("You don't have permission to access that page.")
            return redirect(url_for("auth.login"))
        return view(*args, **kwargs)
    return wrapped


def admin_required_api(view):
    """Same as admin_required but for JSON endpoints — no redirect, no flash."""
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not session.get("user_id"):
            return jsonify({"errors": "Not authenticated"}), 401
        if session.get("role") != "ADMIN":
            return jsonify({"errors": "Forbidden"}), 403
        return view(*args, **kwargs)
    return wrapped


@jwt_required(optional=True)
def admin_api_guard():
    """before_request guard for admin JSON blueprints.

    Accepts either an existing admin session (admin UI) or a valid admin JWT.
    Returns an error response to abort the request, or None to continue.
    """
    user_id = get_jwt_identity()

    if user_id:
        user = User.query.get(user_id)
        if not user or user.role != Role.ADMIN:
            return jsonify({"errors": "Forbidden"}), 403
        return None

    if session.get("user_id"):
        if session.get("role") != "ADMIN":
            return jsonify({"errors": "Forbidden"}), 403
        return None

    return jsonify({"errors": "Not authenticated"}), 401