from flask import render_template
from . import admin_bp
from ..auth.decorators import admin_required


@admin_bp.route("/payments")
@admin_required
def payments():
	return render_template(
		"pages/admin/payments.html",
		title="Payments"
	)
