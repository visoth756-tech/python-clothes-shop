from functools import wraps
from flask import session, redirect, url_for, flash, request, jsonify


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