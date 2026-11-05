from urllib.parse import urlsplit

from flask import render_template, request, redirect, url_for, session, flash
from werkzeug.security import check_password_hash, generate_password_hash

from app.services.auth import auth_stamp, invalidate_login
from app.extensions import db, limiter
from app.models import User
from ...models.enums import Role, UserStatus
from . import auth_bp


@auth_bp.route("/login", methods=["GET"])
def login_page():
	return render_template("auth/login.html", title="Login")


@auth_bp.route("/login", methods=["POST"])
@limiter.limit("5 per minute", deduct_when=lambda response: response.status_code == 401)
def login():
	if request.method == "POST":
		username = request.form.get("username", "").strip()
		password = request.form.get("password", "")
		
		user = User.query.filter_by(username=username).first()
		
		if not user or not check_password_hash(user.password, password):
			flash("Invalid username or password.")
			return render_template("auth/login.html", title="Login"), 401
		
		if user.status != UserStatus.ACTIVE:
			flash("Account had been Blocked.")
			return render_template("auth/login.html", title="Login"), 401
		
		session.clear()
		session.permanent = bool(request.form.get("remember"))
		session["auth_stamp"] = auth_stamp(user)
		session["user_id"] = user.id
		session["username"] = user.username
		session["role"] = user.role.value
		session["image"] = user.image or ""
		
		flash("Welcome back!")
		
		next_page = request.args.get("next")
		if (next_page and next_page.startswith("/")
				and not next_page.startswith("//") and "\\" not in next_page
				and not any(ord(char) < 32 for char in next_page)
				and not urlsplit(next_page).netloc):
			return redirect(next_page)
		if user.role.value == "ADMIN":
			return redirect(url_for("admin.dashboard"))
		return redirect(url_for("main.index"))
	
	return render_template("auth/login.html", title="Login")


@auth_bp.route("/register", methods=["GET", "POST"])
def register():
	if request.method == "POST":
		username = request.form.get("username", "").strip()
		password = request.form.get("password", "")
		confirm_password = request.form.get("confirmPassword", "")
		
		if not username:
			flash("Username is required.")
			return render_template("auth/register.html", title="Register")
		if not password:
			flash("Password is required.")
			return render_template("auth/register.html", title="Register")
		if password != confirm_password:
			flash("Passwords don't match.")
			return render_template("auth/register.html", title="Register")
		
		if User.query.filter_by(username=username).first():
			flash("Username already taken.")
			return render_template("auth/register.html", title="Register")
		
		user = User(
			username=username,
			password=generate_password_hash(password),
			role=Role.USER,  # change ADMIN to USER back
			status=UserStatus.ACTIVE,
		)
		db.session.add(user)
		db.session.commit()
		
		session.clear()
		session["auth_stamp"] = auth_stamp(user)
		session["user_id"] = user.id
		session["username"] = user.username
		session["role"] = user.role.value
		session['image'] = user.image or ''
		
		flash("Account created — welcome!")
		return redirect(url_for("main.index"))  # replace admin.dashboard to home.index
	
	return render_template("auth/register.html", title="Register")


@auth_bp.route("/logout", methods=["GET", "POST"])
def logout():
	if request.method == "GET":
		return render_template("auth/logout.html")
	user = db.session.get(User, session.get("user_id")) if session.get("user_id") else None
	if user:
		invalidate_login(user)
		db.session.commit()
	session.clear()
	return render_template("auth/signed_out.html", message="Logged out.")
