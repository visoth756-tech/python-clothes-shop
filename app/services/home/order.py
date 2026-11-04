from flask import session
from app.models import Order
from app.services.orders import serialize_order
from .catalog import product_data, format_price


def owned_order(order_id):
    return Order.query.filter_by(id=order_id, user_id=session["user_id"]).first_or_404()


def order_view(order):
    data = serialize_order(order)
    data.update(total=format_price(int(order.total_amount * 100)), date=order.created_at.strftime("%B %d, %Y"), paid=any(p["status"] == "PAID" for p in data["payments"]))
    for item, model in zip(data["items"], order.items):
        image = product_data(model.product)["imageUrl"] if model.product else ""
        item.update(name=item["productName"], imageUrl=image, price=format_price(int(model.price * 100)), subtotal=format_price(int(model.subtotal * 100)))
    return data
