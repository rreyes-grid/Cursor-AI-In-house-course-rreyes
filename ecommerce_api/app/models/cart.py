from app.extensions import db


class Cart(db.Model):
    __tablename__ = "eco_carts"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("eco_users.id"), unique=True, nullable=False)

    discount_code_id = db.Column(db.Integer, db.ForeignKey("eco_discount_codes.id"), nullable=True)

    user = db.relationship("User", back_populates="cart")
    discount_code = db.relationship("DiscountCode")
    items = db.relationship(
        "CartItem",
        back_populates="cart",
        cascade="all, delete-orphan",
    )


class CartItem(db.Model):
    __tablename__ = "eco_cart_items"

    id = db.Column(db.Integer, primary_key=True)
    cart_id = db.Column(db.Integer, db.ForeignKey("eco_carts.id"), nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey("eco_products.id"), nullable=False, index=True)
    quantity = db.Column(db.Integer, nullable=False)

    cart = db.relationship("Cart", back_populates="items")
    product = db.relationship("Product")

    __table_args__ = (db.UniqueConstraint("cart_id", "product_id", name="uq_cart_product"),)
