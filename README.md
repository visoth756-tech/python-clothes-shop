# python-clothes-shop

# Clone project
git clone YOUR_REPOSITORY_URL
cd python-clothes-shop

# Create virtual environment
python -m venv .venv

# Activate (Windows)
source .venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Run Node dependencies
npm run dev

# Configure environment
copy .env.example .env

# Initialize database (if using Flask-Migrate)
flask db upgrade

# Run application
flask run

## Checkout and Telegram

The storefront flow is Cart → Checkout (customer details) → Payment → Confirmation.
Run `python -m flask --app app db upgrade` in the application's virtual environment
before starting the updated application, then restart Passenger/cPanel.
The migration preserves existing orders; their customer fields remain empty.

Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in the server environment or `.env`.
An order notification is sent only when payment is PAID, once per order.
It includes customer details, items, total and payment method.
Delivery attempts are recorded in `order_notifications` as SENDING, SENT, or FAILED.
Network timeouts may mean Telegram received a message without returning a response;
failed or interrupted attempts are therefore not automatically resent. Check logs and
Telegram before manually retrying a delivery. Checkout remains saved if Telegram fails.

Payment selection uses the existing `/api/payments` endpoint. Cash is an instant test payment: it marks payment PAID, confirms the order and
deducts stock without charging real money. Bakong requires provider verification
before the confirmation page is available. Failed/cancelled payment retries
reuse the order, payment record, and provider reference. Expired QR codes are hidden;
verification of the original reference remains available, and a new payable reference
is not issued automatically (to avoid charging a delayed payment twice).

API order creation now requires the five customer fields (`first_name`, `last_name`,
`email`, `phone`, `delivery_address`) and a caller-generated `checkout_key` (32–64
lowercase hexadecimal characters). Repeat submissions with the same key return the
existing owned order. Prices and totals are always calculated from stored products.

Run regression tests with `python -m unittest discover -s tests -v`.
Tests use an isolated database and mock Telegram and Bakong; they never send real
notifications or payments.
