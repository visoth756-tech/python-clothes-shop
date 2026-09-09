products = [
    {
        "id": "e43638ce-6aa0-4b85-b27f-e1d07eb678c6",
        "image": "athletic-cotton-socks-6-pairs.jpg",
        "name": "Black and Gray Athletic Cotton Socks - 6 Pairs",
        "rating": {"stars": 4.5, "count": 87},
        "priceCents": 1090,
        "keywords": ["socks", "sports", "apparel"],
    },
    {
        "id": "86209cff-a5e2-4938-9b41-a1b66e4e0001",
        "image": "intermediate-composite-basketball.jpg",
        "name": "Intermediate Size Composite Basketball",
        "rating": {"stars": 4.0, "count": 127},
        "priceCents": 2095,
        "keywords": ["sports", "basketball", "outdoor"],
    },
    {
        "id": "54e0eccd-8f36-462b-b68a-8182611d9add",
        "image": "electric-glass-and-steel-hot-water-kettle.jpg",
        "name": "Electric Glass and Steel Hot Water Kettle",
        "rating": {"stars": 4.7, "count": 212},
        "priceCents": 3490,
        "keywords": ["kitchen", "appliances", "home"],
    },
    {
        "id": "15b6fc6f-327a-4ec4-896f-486349e85a3d",
        "image": "plain-hooded-fleece-sweatshirt.jpg",
        "name": "Plain Hooded Fleece Sweatshirt",
        "rating": {"stars": 4.2, "count": 94},
        "priceCents": 2400,
        "keywords": ["sweaters", "hoodies", "apparel", "mens"],
    },
    {
        "id": "83d4ca85-1077-4f0f-b257-a3d15b42c07f",
        "image": "women-plain-t-shirt.jpg",
        "name": "Women's Plain Cotton T-Shirt",
        "rating": {"stars": 4.3, "count": 156},
        "priceCents": 1299,
        "keywords": ["tshirts", "apparel", "womens", "tops"],
    },
    {
        "id": "d2087b3e-4f5a-48dc-a2f7-ae1e4c5f7803",
        "image": "slim-fit-jeans.jpg",
        "name": "Men's Slim Fit Stretch Jeans",
        "rating": {"stars": 4.1, "count": 203},
        "priceCents": 3999,
        "keywords": ["jeans", "pants", "apparel", "mens", "bottoms"],
    },
    {
        "id": "a96fec12-b3c7-4d5e-af2b-9c7d1e2f8b34",
        "image": "floral-summer-dress.jpg",
        "name": "Women's Floral Summer Dress",
        "rating": {"stars": 4.6, "count": 178},
        "priceCents": 4599,
        "keywords": ["dresses", "apparel", "womens", "summer"],
    },
    {
        "id": "c7f3a1d9-8e2b-4c6f-b5a7-3d9e0f1c2b45",
        "image": "running-shoes-mens.jpg",
        "name": "Men's Lightweight Running Shoes",
        "rating": {"stars": 4.4, "count": 312},
        "priceCents": 6999,
        "keywords": ["shoes", "footwear", "sports", "mens", "running"],
    },
    {
        "id": "b8e2c4f6-1a3d-4e7b-9c5f-2d8a0e3b6c78",
        "image": "womens-sneakers.jpg",
        "name": "Women's Classic White Sneakers",
        "rating": {"stars": 4.5, "count": 267},
        "priceCents": 5499,
        "keywords": ["shoes", "footwear", "womens", "sneakers"],
    },
    {
        "id": "f1d3e5b7-2c4a-4f8d-a6b9-0e7c2d5f8a12",
        "image": "leather-belt.jpg",
        "name": "Genuine Leather Reversible Belt",
        "rating": {"stars": 4.3, "count": 89},
        "priceCents": 2799,
        "keywords": ["accessories", "belt", "mens", "leather"],
    },
    {
        "id": "a2b4c6d8-3e5f-4a7b-8c9d-1f2e3b4c5d67",
        "image": "winter-scarf.jpg",
        "name": "Knitted Winter Scarf - Unisex",
        "rating": {"stars": 4.6, "count": 143},
        "priceCents": 1899,
        "keywords": ["accessories", "scarf", "winter", "apparel"],
    },
    {
        "id": "e9f1a3b5-4c6d-4e8f-b0a2-2d4c6e8f0a23",
        "image": "baseball-cap.jpg",
        "name": "Classic Adjustable Baseball Cap",
        "rating": {"stars": 4.2, "count": 198},
        "priceCents": 1499,
        "keywords": ["accessories", "hats", "caps", "apparel"],
    },
]


def get_product_by_id(product_list, product_id):
    for product in product_list:
        if product["id"] == product_id:
            return product
    return None


def get_related_products(product_list, current_product):
    current_keywords = set(current_product.get("keywords", []))
    related = []
    for product in product_list:
        if product["id"] == current_product["id"]:
            continue
        product_keywords = set(product.get("keywords", []))
        if current_keywords.intersection(product_keywords):
            related.append(product)
    return related[:8]


def get_all_keywords(product_list):
    keywords = set()
    for product in product_list:
        for kw in product.get("keywords", []):
            keywords.add(kw)
    return sorted(keywords)


def filter_products(product_list, keyword=None, search=None):
    result = product_list
    if keyword:
        result = [p for p in result if keyword in p.get("keywords", [])]
    if search:
        search_lower = search.lower()
        result = [p for p in result if search_lower in p["name"].lower()]
    return result


def format_price(price_cents):
    return f"${price_cents / 100:.2f}"
