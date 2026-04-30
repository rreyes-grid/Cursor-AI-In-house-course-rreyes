from app.models.cart import Cart, CartItem
from app.models.email_notification import EmailNotification
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.user import User


def user_public(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


def product_summary(p: Product) -> dict:
    return {
        "id": p.id,
        "sku": p.sku,
        "title": p.title,
        "description": p.description,
        "price_cents": p.price_cents,
        "stock_qty": p.stock_qty,
        "image_url": p.image_url,
        "active": p.active,
    }


def cart_line_item(item: CartItem, line_subtotal_cents: int) -> dict:
    p = item.product
    return {
        "cart_item_id": item.id,
        "product_id": p.id if p else None,
        "sku": p.sku if p else None,
        "title": p.title if p else "Unavailable",
        "quantity": item.quantity,
        "unit_price_cents": p.price_cents if p else 0,
        "line_subtotal_cents": line_subtotal_cents,
        "stock_qty": p.stock_qty if p else 0,
        "available": bool(p and p.active),
    }


def order_summary(order: Order) -> dict:
    return {
        "id": order.id,
        "confirmation_number": order.confirmation_number,
        "payment_status": order.payment_status,
        "payment_reference": order.payment_reference,
        "subtotal_cents": order.subtotal_cents,
        "discount_cents": order.discount_cents,
        "total_cents": order.total_cents,
        "discount_code_label": order.discount_code_label,
        "created_at": order.created_at.isoformat() if order.created_at else None,
    }


def order_item_public(oi: OrderItem) -> dict:
    return {
        "title": oi.title_snapshot,
        "product_id": oi.product_id,
        "unit_price_cents": oi.unit_price_cents,
        "quantity": oi.quantity,
        "line_subtotal_cents": oi.unit_price_cents * oi.quantity,
    }


def order_detail(order: Order) -> dict:
    body = order_summary(order)
    body["items"] = [order_item_public(i) for i in order.items]
    return body


def email_notification_public(n: EmailNotification) -> dict:
    return {
        "id": n.id,
        "notification_type": n.notification_type,
        "subject": n.subject,
        "body_text": n.body_text,
        "order_id": n.order_id,
        "smtp_attempted": n.smtp_attempted,
        "created_at": n.created_at.isoformat() if n.created_at else None,
    }
