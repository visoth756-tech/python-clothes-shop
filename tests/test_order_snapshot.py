import unittest
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from unittest.mock import patch

from app import create_app
from app.config import Config
from app.extensions import db
from app.models import Category, Product, User
from app.models.enums import OrderStatus, PaymentMethod, PaymentStatus
from app.services.orders import create_order
from app.services.payments import check_payment_status, create_payment, serialize_payment


class SnapshotTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        class TestConfig(Config):
            TESTING = True
            SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
            WTF_CSRF_ENABLED = False
        cls.app = create_app(TestConfig)

    def setUp(self):
        self.context = self.app.app_context()
        self.context.push()
        db.create_all()
        self.user = User(username='buyer', password='test-hash')
        self.product = Product(name='Coffee', price=Decimal('10.00'), qty=5,
                               category=Category(name='Drinks'))
        db.session.add_all([self.user, self.product])
        db.session.commit()
        self.qr = patch('app.services.payments.bakong.generate_qr', return_value={
            'qr': 'test-qr', 'token': 'test-token', 'transaction_id': 'test-transaction',
            'expires_at': datetime.now(UTC) + timedelta(minutes=5),
        })
        self.qr.start()

    def tearDown(self):
        self.qr.stop()
        db.session.remove()
        db.drop_all()
        self.context.pop()

    def order(self, method='BAKONG', quantities=(2,)):
        order, error, _ = create_order(self.user, {'items': [
            {'product_id': self.product.id, 'qty': qty} for qty in quantities
        ]}, method)
        self.assertIsNone(error)
        return order

    def check(self, payment, result):
        with patch('app.services.payments.bakong.check_status', return_value=result):
            return check_payment_status(payment)

    def test_pending_keeps_stock_and_paid_deducts_once(self):
        order = self.order()
        self.assertEqual(self.product.qty, 5)
        self.assertEqual(order.items[0].stock_snapshot, 5)
        self.check(order.payments[0], 'PAID')
        db.session.refresh(self.product)
        self.assertEqual(self.product.qty, 3)
        self.assertEqual(order.status, OrderStatus.CONFIRMED)
        self.check(order.payments[0], 'PAID')
        db.session.refresh(self.product)
        self.assertEqual(self.product.qty, 3)

    def test_zero_stock_fails_and_blocks_retry(self):
        order = self.order()
        self.product.qty = 0
        db.session.commit()
        self.check(order.payments[0], 'PENDING')
        self.assertEqual(order.status, OrderStatus.FAILED)
        self.assertIn('stock changed from 5 to 0', order.failure_reason)
        self.assertEqual(order.payments[0].status, PaymentStatus.FAILED)
        payment, error, _ = create_payment(order, self.user.id, PaymentMethod.BAKONG)
        self.assertIsNone(payment)
        self.assertIn('stock', error)
        self.assertEqual(self.product.qty, 0)

    def test_price_and_name_warnings_survive_reload(self):
        order = self.order()
        self.product.price = Decimal('12.00')
        self.product.name = 'Tea'
        db.session.commit()
        self.check(order.payments[0], 'PENDING')
        db.session.expire_all()
        self.assertIn('name changed to "Tea"', order.failure_reason)
        self.assertIn('price changed from 10.00 to 12.00', order.failure_reason)
        self.assertEqual(order.items[0].product_name, 'Coffee')
        self.assertEqual(order.items[0].price, Decimal('10.00'))

    def test_received_money_does_not_confirm_invalid_order(self):
        order = self.order()
        self.product.qty = 0
        db.session.commit()
        self.check(order.payments[0], 'PAID')
        data = serialize_payment(order.payments[0])
        self.assertEqual(data['status'], 'PAID')
        self.assertEqual(data['orderStatus'], 'FAILED')
        self.assertIn('refund', data['warning'])
        self.assertEqual(self.product.qty, 0)

    def test_cash_deducts_once(self):
        order = self.order('CASH')
        db.session.refresh(self.product)
        self.assertEqual(self.product.qty, 3)
        self.assertEqual(order.status, OrderStatus.CONFIRMED)
        create_payment(order, self.user.id, PaymentMethod.CASH)
        db.session.refresh(self.product)
        self.assertEqual(self.product.qty, 3)

    def test_duplicate_lines_cannot_oversell(self):
        order, error, _ = create_order(self.user, {'items': [
            {'product_id': self.product.id, 'qty': 3},
            {'product_id': self.product.id, 'qty': 3},
        ]}, 'CASH')
        self.assertIsNone(order)
        self.assertIn('insufficient stock', error)
        db.session.refresh(self.product)
        self.assertEqual(self.product.qty, 5)

    def test_recreating_qr_validates_before_provider(self):
        order = self.order()
        self.product.price = Decimal('20.00')
        db.session.commit()
        with patch('app.services.payments.refresh_qr') as refresh:
            payment, error, _ = create_payment(order, self.user.id, PaymentMethod.BAKONG)
            refresh.assert_not_called()
        self.assertIsNone(payment)
        self.assertIn('price', error)
        self.assertEqual(order.status, OrderStatus.FAILED)

    def test_legacy_order_without_snapshot_cannot_confirm(self):
        order = self.order()
        order.items[0].stock_snapshot = None
        db.session.commit()
        self.check(order.payments[0], 'PENDING')
        self.assertEqual(order.status, OrderStatus.FAILED)
        self.assertIn('no stock snapshot', order.failure_reason)


if __name__ == '__main__':
    unittest.main()
