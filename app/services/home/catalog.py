from decimal import Decimal
from flask import url_for
from app.models import Product, Category


def format_price(cents):
    return f"${Decimal(cents) / 100:,.2f}"


def product_data(product):
    image = product.image or ""
    image_url = url_for("static", filename="uploads/products/" + image) if image else url_for("static", filename="img/default-avatar.png")
    return {
        "id": product.id, "name": product.name, "description": product.description or "",
        "image": image, "imageUrl": image_url,
        "priceCents": int(product.price * 100), "stock": product.qty,
        "keywords": [product.category.name] if product.category else [],
    }


def catalog_query(keyword="", search=""):
    query = Product.query.join(Category)
    if keyword:
        query = query.filter(Category.name == keyword)
    if search:
        # Treat user input as a literal substring, including SQL wildcards.
        query = query.filter(Product.name.icontains(search, autoescape=True) | Product.description.icontains(search, autoescape=True))
    return query.order_by(Product.created_at.desc())
