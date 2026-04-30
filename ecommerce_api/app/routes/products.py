from flask import Blueprint, abort, jsonify, request
from sqlalchemy import or_

from app.extensions import db
from app.models.product import Product
from app.serializers import product_summary

bp = Blueprint("products", __name__, url_prefix="/api/products")


@bp.route("", methods=["GET"])
def list_products():
    """
    List active catalog products; optional case-insensitive substring search.
    ---
    tags:
      - Products
    parameters:
      - in: query
        name: q
        type: string
        required: false
        description: Matches product title or SKU
    responses:
      200:
        description: Paginated-style array in `products`
    """
    q = request.args.get("q", "").strip().lower()
    stmt = Product.query.filter_by(active=True)
    if q:
        stmt = stmt.filter(
            or_(
                Product.title.ilike(f"%{q}%"),
                Product.sku.ilike(f"%{q}%"),
            )
        )
    items = stmt.order_by(Product.title).all()
    return jsonify(
        {
            "status": "success",
            "products": [product_summary(p) for p in items],
        }
    )


@bp.route("/<int:product_id>", methods=["GET"])
def product_detail(product_id: int):
    """
    Retrieve a single active product by identifier.
    ---
    tags:
      - Products
    parameters:
      - in: path
        name: product_id
        type: integer
        required: true
    responses:
      200:
        description: Product payload
      404:
        description: Not found or inactive
    """
    p = Product.query.filter_by(id=product_id, active=True).first()
    if not p:
        abort(404)
    return jsonify({"status": "success", "product": product_summary(p)})
