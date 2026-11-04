from functools import wraps
from flask import session, redirect, url_for, flash, request, jsonify, g, current_app
from jwt import InvalidTokenError
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from flask_jwt_extended.exceptions import JWTExtendedException

from app.extensions import csrf
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


def admin_api_guard():
    """before_request guard for admin JSON blueprints.

    Accepts either an existing admin session (admin UI) or a valid admin JWT.
    A bad/expired JWT is ignored so the session can still be used.
    Returns an error response to abort the request, or None to continue.
    """
    user_id = None

    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
    except (JWTExtendedException, InvalidTokenError):
        user_id = None

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


def api_user_guard():
    """before_request guard for user API blueprints.

    Accepts either an active session or a valid JWT (any role) and puts the
    user on flask.g. Session requests must still carry a CSRF token for
    state-changing methods; JWT requests are exempt.
    """
    user_id = None
    via_jwt = False

    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
        via_jwt = bool(user_id)
    except (JWTExtendedException, InvalidTokenError):
        user_id = None

    if not user_id:
        user_id = session.get("user_id")

    user = User.query.get(user_id) if user_id else None

    if not user:
        return jsonify({"errors": "Not authenticated"}), 401

    g.current_user = user

    if (
        not via_jwt
        and request.method in ("POST", "PUT", "PATCH", "DELETE")
        and current_app.config.get("WTF_CSRF_ENABLED", True)
    ):
        csrf.protect()

    return None