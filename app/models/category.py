from .base import BaseDocument
from app.extensions import db


class Category(BaseDocument):
	__tablename__ = "categories"
	
	name = db.Column(
		db.String(255),
		nullable=False,
		unique=True
	)
	
	products = db.relationship(
		"Product",
		back_populates="category"
	)
	
	def __repr__(self):
		return f"<Category {self.name}>"
