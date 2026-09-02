from flask import render_template
from . import admin_bp
from ..auth.decorators import admin_required


@admin_bp.route("/orders")
@admin_required
def orders():
	return render_template(
		"pages/admin/orders.html",
		title="Orders"
	)