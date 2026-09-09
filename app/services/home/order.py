import json
import uuid
from datetime import datetime
from flask import request
from data.products import format_price


def get_order():
	raw = request.cookies.get("order")
	if not raw:
		return None
	try:
		return json.loads(raw)
	except (ValueError, TypeError):
		return None


def set_order(response, order):
	response.set_cookie("order", json.dumps(order), max_age=60 * 60 * 24)
	return response


def clear_order(response):
	response.delete_cookie("order")
	return response


def create_order_dict(form_data, items, total_cents):
	return {
		"id": str(uuid.uuid4())[:8].upper(),
		"name": form_data.get("name"),
		"email": form_data.get("email"),
		"address": form_data.get("address"),
		"city": form_data.get("city"),
		"items": items,
		"total": format_price(total_cents),
		"total_cents": total_cents,
		"date": datetime.now().strftime("%B %d, %Y"),
	}
