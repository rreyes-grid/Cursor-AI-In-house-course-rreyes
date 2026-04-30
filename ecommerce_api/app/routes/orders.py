from typing import Optional
from uuid import uuid4

from flask import Blueprint, g, jsonify, request

from app.cart_totals import clear_cart_items, get_or_create_cart, summarize_cart_response
from app.decorators import jwt_user_required
from app.errors import ApiError
from app.extensions import db
from app.mailer import record_and_send_email
from app.models.discount import DiscountCode
from app.models.order import Order, OrderItem
from app.payment_mock import process_mock_payment
from app.schemas import CheckoutSchema
from app.serializers import order_detail, order_summary

bp = Blueprint("orders", __name__, url_prefix="/api/orders")


@bp.route("", methods=["GET"])
@jwt_user_required
def list_orders():
    """
    Return every order belonging to authenticated shopper (paid attempts only persisted on success paths).
    ---
    tags:
      - Orders
    security:
      - Bearer: []
    responses:
      200:
        description: Ordered history array
      401:
        description: Unauthorized
    """
    rows = (
        Order.query.filter_by(user_id=g.current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return jsonify(
        {
            "status": "success",
            "orders": [order_summary(o) for o in rows],
        }
    )


@bp.route("/<int:order_id>", methods=["GET"])
@jwt_user_required
def get_order(order_id: int):
    """
    Hydrate detailed line-items for caller-owned receipt.
    ---
    tags:
      - Orders
    security:
      - Bearer: []
    parameters:
      - in: path
        name: order_id
        type: integer
        required: true
    responses:
      200:
        description: Order plus items snapshots
      404:
        description: Order missing or mismatched tenant
      401:
        description: Unauthorized
    """
    o = Order.query.filter_by(id=order_id, user_id=g.current_user.id).first()
    if not o:
        raise ApiError("Order not found", 404, "NOT_FOUND")
    return jsonify({"status": "success", "order": order_detail(o)})


@bp.route("/checkout", methods=["POST"])
@jwt_user_required
def checkout():
    """
    Finalize totals, decrement inventory, enqueue confirmation email audit, cart cleared on success only.
    Mock PSP tokens (`tok_charge_success`, `tok_charge_declined`).
    ---
    tags:
      - Orders
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
          required: [payment_token]
          properties:
            payment_token:
              type: string
              description: |
                Simulate gateway token: `tok_charge_success` captures immediately,
                `tok_charge_declined` returns HTTP 402 with cart echo.
              example: tok_charge_success
    responses:
      201:
        description: Paid order persisted
      402:
        description: Mock decline; retains cart snapshot in response
      422:
        description: Empty cart, discount invalid, SKU missing, insufficient stock
      503:
        description: MOCK_PAYMENT_ENABLED switched off server-side
      401:
        description: Unauthorized
    """
    from flask import current_app

    if not current_app.config.get("MOCK_PAYMENT_ENABLED", True):
        raise ApiError("Payment processing unavailable", 503, "SERVICE_UNAVAILABLE")

    cart = get_or_create_cart(g.current_user)
    summary = summarize_cart_response(cart)
    if summary["subtotal_cents"] <= 0:
        raise ApiError("Cart is empty", 422, "UNPROCESSABLE")

    eligible_lines = []
    subtotal_cents = 0
    for item in cart.items:
        p = item.product
        if not p or not p.active:
            raise ApiError("Cart contains unavailable products", 422, "UNPROCESSABLE")
        if p.stock_qty < item.quantity:
            raise ApiError(f"Insufficient stock for {p.title}", 422, "UNPROCESSABLE")
        line = item.quantity * p.price_cents
        subtotal_cents += line
        eligible_lines.append((p, item.quantity))

    discount_cents = 0
    discount_label = None
    dc: Optional[DiscountCode] = None
    if cart.discount_code_id:
        dc = DiscountCode.query.get(cart.discount_code_id)
        if not dc:
            cart.discount_code_id = None
            db.session.commit()
        else:
            ok, reason = dc.applies_ok(subtotal_cents)
            if not ok:
                raise ApiError(f"Discount no longer applies: {reason}", 422, "UNPROCESSABLE")
            discount_cents = dc.compute_discount(subtotal_cents)
            discount_label = dc.code

    total_cents = max(0, subtotal_cents - discount_cents)

    data = CheckoutSchema().load(request.get_json(force=True, silent=True) or {})
    payment_token = data["payment_token"].strip()

    ok_pay, pref = process_mock_payment(total_cents, payment_token)

    if not ok_pay:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Payment was declined; no charge was made",
                    "code": "PAYMENT_DECLINED",
                    "cart": summarize_cart_response(cart),
                }
            ),
            402,
        )

    confirmation_number = str(uuid4())
    order = Order(
        user_id=g.current_user.id,
        confirmation_number=confirmation_number,
        payment_status="succeeded",
        payment_reference=pref,
        mock_payment_token=payment_token,
        subtotal_cents=subtotal_cents,
        discount_cents=discount_cents,
        total_cents=total_cents,
        discount_code_label=discount_label,
    )
    db.session.add(order)
    db.session.flush()

    for p, qty in eligible_lines:
        p.stock_qty -= qty
        db.session.add(
            OrderItem(
                order_id=order.id,
                product_id=p.id,
                title_snapshot=p.title,
                unit_price_cents=p.price_cents,
                quantity=qty,
            )
        )

    if dc:
        dc.uses_count += 1

    clear_cart_items(cart)
    db.session.commit()

    body_text = (
        f"Thanks for your order, {g.current_user.name}!\n\n"
        f"Confirmation: {confirmation_number}\n"
        f"Total charged: ${total_cents / 100:.2f}\n"
        f"Items:\n"
        + "\n".join(
            f"  - {p.title} x {qty} @ ${p.price_cents / 100:.2f}"
            for p, qty in eligible_lines
        )
    )
    if discount_label:
        body_text += f"\n\nDiscount ({discount_label}): -${discount_cents / 100:.2f}"

    record_and_send_email(
        user_id=g.current_user.id,
        order_id=order.id,
        notification_type="order_confirmation",
        to_address=g.current_user.email,
        subject=f"Order confirmed — {confirmation_number}",
        body=body_text,
    )

    return (
        jsonify(
            {
                "status": "success",
                "message": "Order placed successfully",
                "order": order_detail(order),
            }
        ),
        201,
    )
