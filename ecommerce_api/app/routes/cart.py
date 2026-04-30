from flask import Blueprint, g, jsonify, request

from app.cart_totals import get_or_create_cart, summarize_cart_response
from app.decorators import jwt_user_required
from app.errors import ApiError
from app.extensions import db
from app.models.cart import CartItem
from app.models.discount import DiscountCode
from app.models.product import Product
from app.schemas import CartAddSchema, CartItemUpdateSchema, DiscountApplySchema

bp = Blueprint("cart", __name__, url_prefix="/api/cart")


@bp.route("", methods=["GET"])
@jwt_user_required
def get_cart():
    """
    Return the shopper cart with line items, subtotal, discount preview, and total.
    ---
    tags:
      - Cart
    security:
      - Bearer: []
    responses:
      200:
        description: Cart summary
      401:
        description: Unauthorized
    """
    cart = get_or_create_cart(g.current_user)
    body = summarize_cart_response(cart)
    return jsonify(body)


@bp.route("/items", methods=["POST"])
@jwt_user_required
def add_item():
    """
    Merge or append a SKU line respecting current stock constraints.
    ---
    tags:
      - Cart
    security:
      - Bearer: []
    consumes:
      - application/json
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [product_id, quantity]
          properties:
            product_id:
              type: integer
              description: Identifier from catalog
            quantity:
              type: integer
              minimum: 1
              maximum: 999
    responses:
      201:
        description: Updated cart totals
      404:
        description: Product inactive
      422:
        description: Out of stock
      401:
        description: Unauthorized
    """
    cart = get_or_create_cart(g.current_user)
    data = CartAddSchema().load(request.get_json(force=True, silent=True) or {})
    pid = data["product_id"]
    qty = data["quantity"]

    p = Product.query.filter_by(id=pid, active=True).first()
    if not p:
        raise ApiError("Product not found", 404, "NOT_FOUND")

    if p.stock_qty < qty:
        raise ApiError("Not enough stock available", 422, "UNPROCESSABLE")

    existing = CartItem.query.filter_by(cart_id=cart.id, product_id=pid).first()
    new_qty = (existing.quantity + qty) if existing else qty
    if p.stock_qty < new_qty:
        raise ApiError("Not enough stock available", 422, "UNPROCESSABLE")

    if existing:
        existing.quantity = new_qty
    else:
        db.session.add(CartItem(cart_id=cart.id, product_id=pid, quantity=qty))
    db.session.commit()

    return jsonify(summarize_cart_response(cart)), 201


@bp.route("/items/<int:item_id>", methods=["PATCH"])
@jwt_user_required
def update_item(item_id: int):
    """
    Update quantity for one cart-line owned by caller.
    ---
    tags:
      - Cart
    security:
      - Bearer: []
    consumes:
      - application/json
    parameters:
      - in: path
        name: item_id
        type: integer
        required: true
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [quantity]
          properties:
            quantity:
              type: integer
              minimum: 1
              maximum: 999
    responses:
      200:
        description: Updated cart totals
      404:
        description: Unknown line
      422:
        description: SKU unavailable or violates stock cap
      401:
        description: Unauthorized
    """
    cart = get_or_create_cart(g.current_user)
    data = CartItemUpdateSchema().load(request.get_json(force=True, silent=True) or {})
    item = CartItem.query.filter_by(id=item_id, cart_id=cart.id).first()
    if not item:
        raise ApiError("Cart line not found", 404, "NOT_FOUND")
    p = item.product
    if not p or not p.active:
        raise ApiError("Product is no longer available", 422, "UNPROCESSABLE")
    if p.stock_qty < data["quantity"]:
        raise ApiError("Not enough stock available", 422, "UNPROCESSABLE")
    item.quantity = data["quantity"]
    db.session.commit()
    return jsonify(summarize_cart_response(cart))


@bp.route("/items/<int:item_id>", methods=["DELETE"])
@jwt_user_required
def remove_item(item_id: int):
    """
    Remove a cart-line.
    ---
    tags:
      - Cart
    security:
      - Bearer: []
    parameters:
      - in: path
        name: item_id
        type: integer
        required: true
    responses:
      200:
        description: Recalculated cart summary
      404:
        description: Unknown line id
      401:
        description: Unauthorized
    """
    cart = get_or_create_cart(g.current_user)
    item = CartItem.query.filter_by(id=item_id, cart_id=cart.id).first()
    if not item:
        raise ApiError("Cart line not found", 404, "NOT_FOUND")
    db.session.delete(item)
    db.session.commit()
    return jsonify(summarize_cart_response(cart))


@bp.route("/discount", methods=["POST"])
@jwt_user_required
def apply_discount():
    """
    Apply a persisted discount-code reference to the shopper cart (`SAVE10`, `WELCOME5`, etc.).
    ---
    tags:
      - Cart
    security:
      - Bearer: []
    consumes:
      - application/json
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [code]
          properties:
            code: { type: string }
    responses:
      200:
        description: Discount applied
      404:
        description: Unknown code
      422:
        description: Constraints not met for current subtotal/expiry/use limits
      401:
        description: Unauthorized
    """
    cart = get_or_create_cart(g.current_user)
    data = DiscountApplySchema().load(request.get_json(force=True, silent=True) or {})
    code = data["code"].strip().upper()
    dc = DiscountCode.query.filter_by(code=code, active=True).first()
    if not dc:
        raise ApiError("Invalid discount code", 404, "NOT_FOUND")

    summary = summarize_cart_response(cart)
    subtotal = summary["subtotal_cents"]
    ok, reason = dc.applies_ok(subtotal)
    if not ok:
        raise ApiError(f"Discount code cannot be applied: {reason}", 422, "UNPROCESSABLE")

    cart.discount_code_id = dc.id
    db.session.commit()
    return jsonify(summarize_cart_response(cart))


@bp.route("/discount", methods=["DELETE"])
@jwt_user_required
def clear_discount():
    """
    Drop any discount association from cart (totals recomputed automatically).
    ---
    tags:
      - Cart
    security:
      - Bearer: []
    responses:
      200:
        description: Updated cart totals
      401:
        description: Unauthorized
    """
    cart = get_or_create_cart(g.current_user)
    cart.discount_code_id = None
    db.session.commit()
    return jsonify(summarize_cart_response(cart))
