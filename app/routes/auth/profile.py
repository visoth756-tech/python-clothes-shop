from flask import render_template, request, session, jsonify, g
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from werkzeug.security import check_password_hash, generate_password_hash

from . import auth_bp
from .decorators import login_required
from app.extensions import db, limiter
from app.models import User
from app.models.enums import UserStatus
from app.services.auth import valid_stamp, invalidate_login
from app.routes.admin.utils import save_user_image, delete_user_image


@auth_bp.before_app_request
def validate_session_account():
    user_id = session.get("user_id")
    if not user_id:
        return
    user = db.session.get(User, user_id)
    if not user or user.status != UserStatus.ACTIVE or not valid_stamp(user, session.get("auth_stamp")):
        session.clear()
        return
    g.session_user = user


@auth_bp.route("/profile", methods=["GET", "POST"])
@login_required
@limiter.limit("10 per minute", methods=["POST"])
def profile():
    user = g.session_user
    if request.method == "GET":
        return render_template("auth/profile.html", user=user)

    def error(message, code=400):
        if request.accept_mimetypes.best == "application/json":
            return jsonify(errors=message), code
        return render_template("auth/profile.html", user=user, error=message), code

    if not check_password_hash(user.password, request.form.get("current_password", "")):
        return error("Current password is incorrect.")
    username = request.form.get("username", "").strip()
    if not username or len(username) > 255:
        return error("Name must contain between 1 and 255 characters.")
    existing = User.query.filter(func.lower(User.username) == username.lower(), User.id != user.id).first()
    if existing:
        return error("This name is already taken.", 409)
    password = request.form.get("new_password", "")
    if password and (len(password) < 8 or len(password) > 128):
        return error("New password must contain between 8 and 128 characters.")
    if password != request.form.get("confirm_password", ""):
        return error("New passwords do not match.")
    upload = request.files.get("image")
    if upload and upload.filename:
        upload.stream.seek(0, 2)
        size = upload.stream.tell()
        upload.stream.seek(0)
        if size > 5 * 1024 * 1024:
            return error("Profile image must be 5 MB or smaller.")
    new_image = None
    try:
        if upload and upload.filename:
            # Keep the old image until the database commit succeeds.
            new_image = save_user_image(upload)
        user.username = username
        if password:
            user.password = generate_password_hash(password)
        if new_image:
            user.image = new_image
        invalidate_login(user)
        db.session.commit()
    except ValueError as exc:
        db.session.rollback()
        return error(str(exc))
    except IntegrityError:
        db.session.rollback()
        if new_image:
            delete_user_image(new_image)
        return error("This name is already taken.", 409)
    # Preserve existing image files, which may still be referenced elsewhere.
    session.clear()
    if request.accept_mimetypes.best == "application/json":
        return jsonify(success=True, redirect="/auth/login", message="Profile updated. Please sign in again.")
    return render_template("auth/signed_out.html", message="Profile updated. Please sign in again.")


@auth_bp.after_request
def private_auth_response(response):
    response.headers["Cache-Control"] = "no-store"
    return response
