from flask import render_template
from . import admin_bp
from ..auth.decorators import admin_required


@admin_bp.route("/")
@admin_bp.route("")
@admin_required
def dashboard():
	return render_template(
		"admin/dashboard.html",
		title="Dashboard"
	)
