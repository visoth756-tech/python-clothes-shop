from .base import BaseDocument
from app.extensions import db


class OrderItem(BaseDocument):
	__tablename__ = "order_items"
	stock_snapshot = db.Column(db.Integer, nullable=True)
	
	order_id = db.Column(
		db.String(32),
		db.ForeignKey("orders.id"),
		nullable=False
	)
	
	product_id = db.Column(
		db.String(32),
		db.ForeignKey("products.id"),
		nullable=True
	)
	
	product_name = db.Column(
		db.String(255),
		nullable=False
	)
	
	qty = db.Column(
		db.Integer,
		nullable=False,
		default=0
	)
	
	price = db.Column(
		db.Numeric(12, 2),
		nullable=False
	)
	
	subtotal = db.Column(
		db.Numeric(12, 2),
		nullable=True
	)
	
	order = db.relationship(
		"Order",
		back_populates="items"
	)
	
	product = db.relationship("Product")
	
	__table_args__ = (
		db.CheckConstraint(
			"qty > 0",
			name="ck_orderitem_qty_positive"
		),
		db.CheckConstraint(
			"price >= 0.0",
			name="ck_orderitem_price_min"
		),
	)
