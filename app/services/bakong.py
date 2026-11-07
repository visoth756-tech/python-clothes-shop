import base64
import os
from datetime import datetime, UTC, timedelta
from decimal import Decimal, InvalidOperation

from bakong_khqr import KHQR

# KHQR dynamic expiration is expressed in days by this SDK.
QR_EXPIRATION_DAYS = 1


def is_configured():
    return bool(os.getenv("BAKONG_API_TOKEN", "").strip() and os.getenv("BAKONG_ACCOUNT", "").strip())


def _client():
    token = os.getenv("BAKONG_API_TOKEN", "").strip()
    if not token:
        raise ValueError("Bakong payment verification is not configured.")
    return KHQR(token)


def generate_qr(amount, order_id, currency="USD"):
    """Generate KHQR locally and store its MD5 for payment verification.

    Storefront totals are USD; callers must convert totals before requesting KHR.
    Credentials stay on the server and are never returned to the browser.
    """
    try:
        amount = Decimal(str(amount))
    except (InvalidOperation, ValueError):
        raise ValueError("Amount must be greater than zero.") from None
    if not amount.is_finite() or amount <= 0:
        raise ValueError("Amount must be greater than zero.")
    if currency not in ("KHR", "USD"):
        raise ValueError("Invalid currency.")
    account = os.getenv("BAKONG_ACCOUNT", "").strip()
    if not account:
        raise ValueError("Bakong account is not configured.")
    khqr = _client()
    qr_string = str(khqr.create_qr(
        account_id=account,
        merchant_name=os.getenv("MERCHANT_NAME", "Student Project"),
        merchant_city=os.getenv("MERCHANT_CITY", "Phnom Penh"),
        amount=float(amount),
        currency=currency,
        bill_number=str(order_id)[:25],
        static=False,
        expiration=QR_EXPIRATION_DAYS,
    ))
    md5 = khqr.generate_md5(qr_string)
    return {
        "qr": qr_string,
        "token": md5,
        "transaction_id": md5,
        "expires_at": datetime.now(UTC) + timedelta(days=QR_EXPIRATION_DAYS),
    }


def qr_png(qr_string):
    """Render the SDK's KHQR image using the sample's base64 export."""
    encoded = KHQR().qr_image(qr_string, format="base64")
    return base64.b64decode(encoded, validate=True)


def check_status(token, transaction_id=None):
    md5 = transaction_id or token
    if not md5:
        raise ValueError("Payment verification hash is missing.")
    status = str(_client().check_payment(md5)).upper()
    if status == "PAID":
        return "PAID"
    if status in ("FAILED", "EXPIRED"):
        return "FAILED"
    if status in ("CANCELLED", "CANCELED"):
        return "CANCELLED"
    if status in ("UNPAID", "PENDING", "SCANNED"):
        return "PENDING"
    raise ValueError("Unexpected payment provider status.")
