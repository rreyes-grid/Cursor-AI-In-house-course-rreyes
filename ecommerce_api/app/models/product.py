from app.extensions import db


class Product(db.Model):
    __tablename__ = "eco_products"

    id = db.Column(db.Integer, primary_key=True)
    sku = db.Column(db.String(64), unique=True, nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False, default="")
    price_cents = db.Column(db.Integer, nullable=False)
    stock_qty = db.Column(db.Integer, nullable=False, default=0)
    image_url = db.Column(db.String(512), nullable=True)
    active = db.Column(db.Boolean, nullable=False, default=True)
