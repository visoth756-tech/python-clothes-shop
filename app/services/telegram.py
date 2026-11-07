import os
from threading import Thread

import requests
from dotenv import load_dotenv
from flask import current_app
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.extensions import db
from app.models.order import OrderNotification

load_dotenv()

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")


def send_telegram(message):
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    data = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": message,
    }
    
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        raise ValueError("Telegram is not configured")
    try:
        response = requests.post(url, data=data, timeout=(3, 7))
        response.raise_for_status()
        result = response.json()
        if not isinstance(result, dict) or result.get("ok") is not True:
            raise ValueError("Telegram rejected the notification")
    except (requests.RequestException, ValueError):
        raise ValueError("Telegram delivery failed") from None
    return response


def notify_order(order, payment=None):
    try:
        _notify_order(order, payment)
    except SQLAlchemyError:
        db.session.rollback()
        current_app.logger.error("Could not record Telegram notification delivery")


def notify_order_background(order, payment):
    """Keep Telegram's network latency out of the payment response."""
    if payment.status.value != "PAID":
        return
    app = current_app._get_current_object()
    order_id, payment_id = order.id, payment.id

    def deliver():
        from app.models import Order, Payment
        with app.app_context():
            saved_order = db.session.get(Order, order_id)
            saved_payment = db.session.get(Payment, payment_id)
            if saved_order is not None and saved_payment is not None:
                notify_order(saved_order, saved_payment)

    Thread(target=deliver, name="telegram-order-notification", daemon=True).start()


def _notify_order(order, payment=None):
    """Call only after committing order/payment state. Never retry uncertain deliveries."""
    selected_payment = payment or next((p for p in order.payments if p.status.value == "PAID"), None)
    if selected_payment is None or selected_payment.status.value != "PAID":
        return
    event = "paid"
    delivery = OrderNotification(order_id=order.id, event=event)
    try:
        db.session.add(delivery)
        db.session.commit()  # Unique claim prevents concurrent requests sending duplicates.
    except IntegrityError:
        db.session.rollback()
        return
    lines = [
        f"First Name: {order.first_name or '-'}", f"Last Name: {order.last_name or '-'}",
        f"Email: {order.email or '-'}", f"Phone: {order.phone or '-'}",
        f"Delivery Address: {order.delivery_address or '-'}",
        "Items:",
    ]
    lines.extend(f"{item.product_name} | {item.qty} x ${item.price:.2f} = ${item.subtotal:.2f}"
                 for item in order.items)
    lines.extend([f"Total: ${order.total_amount:.2f} USD",
                  f"Payment method: {selected_payment.method.value}"])
    try:
        # Preserve every item while respecting Telegram's message limit.
        chunks = [""]
        for line in lines:
            if len(chunks[-1]) + len(line) + 1 > 3800:
                chunks.append("")
            chunks[-1] += line + "\n"
        for index, chunk in enumerate(chunks, 1):
            prefix = f"({index}/{len(chunks)})\n" if len(chunks) > 1 else ""
            send_telegram(prefix + chunk)
    except (requests.RequestException, ValueError):
        # Do not log exception strings: requests errors can contain the bot token.
        delivery.status = "FAILED"
        current_app.logger.error("Telegram delivery failed for order %s event %s", order.id, event)
    else:
        delivery.status = "SENT"
    db.session.commit()
