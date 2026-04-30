from typing import List, Optional, Tuple

from app.extensions import db
from app.models.cart import Cart, CartItem
from app.models.discount import DiscountCode
from app.models.user import User
from app.serializers import cart_line_item


def get_or_create_cart(user: User) -> Cart:
    c = Cart.query.filter_by(user_id=user.id).first()
    if c:
        return c
    c = Cart(user_id=user.id)
    db.session.add(c)
    db.session.commit()
    return c


def _lines_and_subtotal(cart: Cart) -> Tuple[List[dict], int]:
    lines_out: List[dict] = []
    subtotal = 0
    for item in cart.items:
        p = item.product
        if not p:
            lines_out.append(cart_line_item(item, 0))
            continue
        line_amt = item.quantity * p.price_cents if p.active else 0
        if p.active:
            subtotal += line_amt
        lines_out.append(cart_line_item(item, line_amt))
    return lines_out, subtotal


def summarize_cart_response(cart: Cart) -> dict:
    lines, subtotal_cents = _lines_and_subtotal(cart)

    discount_cents = 0
    discount_code_str: Optional[str] = None
    discount_issue: Optional[str] = None
    dc: Optional[DiscountCode] = cart.discount_code

    eligible_subtotal = sum(
        item.quantity * item.product.price_cents
        for item in cart.items
        if item.product and item.product.active
    )

    if dc:
        ok, reason = dc.applies_ok(eligible_subtotal)
        if ok:
            discount_cents = dc.compute_discount(eligible_subtotal)
            discount_code_str = dc.code
        else:
            discount_issue = reason
            discount_cents = 0

    total_cents = max(0, eligible_subtotal - discount_cents)

    return {
        "status": "success",
        "lines": lines,
        "subtotal_cents": eligible_subtotal,
        "discount_cents": discount_cents,
        "discount_code": discount_code_str,
        "discount_issue": discount_issue,
        "total_cents": total_cents,
    }


def clear_cart_items(cart: Cart) -> None:
    for i in list(cart.items):
        db.session.delete(i)
    cart.discount_code_id = None
