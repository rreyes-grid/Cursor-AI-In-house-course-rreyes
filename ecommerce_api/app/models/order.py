from app.extensions import db


class Order(db.Model):
    __tablename__ = "eco_orders"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("eco_users.id"), nullable=False, index=True)

    confirmation_number = db.Column(db.String(36), unique=True, nullable=False, index=True)

    payment_status = db.Column(db.String(32), nullable=False)  # succeeded, failed
    payment_reference = db.Column(db.String(128), nullable=True)
    mock_payment_token = db.Column(db.String(64), nullable=True)

    subtotal_cents = db.Column(db.Integer, nullable=False)
    discount_cents = db.Column(db.Integer, nullable=False, default=0)
    total_cents = db.Column(db.Integer, nullable=False)

    discount_code_label = db.Column(db.String(64), nullable=True)

    created_at = db.Column(db.DateTime, server_default=db.func.now())

    user = db.relationship("User", back_populates="orders")
    items = db.relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan",
    )


class OrderItem(db.Model):
    __tablename__ = "eco_order_items"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("eco_orders.id"), nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey("eco_products.id"), nullable=False)
    title_snapshot = db.Column(db.String(255), nullable=False)
    unit_price_cents = db.Column(db.Integer, nullable=False)
    quantity = db.Column(db.Integer, nullable=False)

    order = db.relationship("Order", back_populates="items")
    product = db.relationship("Product")
