from .base import BaseDocument
from app.extensions import db


class Product(BaseDocument):
	__tablename__ = "products"
	
	image = db.Column(
		db.String(500),
		nullable=True
	)
	
	name = db.Column(
		db.String(255),
		nullable=False,
		unique = True
	)

	description = db.Column(
		db.String(500),
		nullable=True
	)
	
	price = db.Column(
		db.Numeric(12, 2),
		nullable=False
	)
	
	qty = db.Column(
		db.Integer,
		nullable=False,
		default=0
	)
	
	category_id = db.Column(
		db.String(32),
		db.ForeignKey("categories.id"),
		nullable=False
	)
	
	category = db.relationship(
		"Category",
		back_populates="products"
	)
	
	__table_args__ = (
		db.CheckConstraint("price >= 0.0", name="ck_product_price_min"),
		db.CheckConstraint("qty >= 0", name="ck_product_qty_min"),
	)
	
	def __repr__(self):
		return f"<Product {self.name}>"
