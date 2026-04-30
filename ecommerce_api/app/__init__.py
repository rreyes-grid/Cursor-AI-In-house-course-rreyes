import os

from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS
from flasgger import Swagger

from app.config import config_by_name
from app.errors import register_error_handlers
from app.extensions import db, limiter, register_extensions


def create_app(config_name=None, **config_overrides):
    load_dotenv()
    app = Flask(__name__)
    cfg = config_name or os.environ.get("FLASK_ENV", "development")
    app.config.from_object(config_by_name.get(cfg, config_by_name["default"]))
    app.config.update(config_overrides)

    if app.config.get("TESTING"):
        app.config["RATELIMIT_ENABLED"] = bool(
            app.config.get("RATELIMIT_ENABLED_IN_TESTS", False)
        )
    else:
        app.config.setdefault("RATELIMIT_ENABLED", True)

    register_extensions(app)
    register_error_handlers(app)

    origins = app.config.get("CORS_ORIGINS", ["http://localhost:5173"])
    if isinstance(origins, str):
        origins = [o.strip() for o in origins.split(",")]
    CORS(app, resources={r"/api/*": {"origins": origins}}, supports_credentials=True)

    app.config["SWAGGER"] = {
        "title": "E-commerce API",
        "version": "1.0.0",
        "description": (
            "Shopping API with JWT authentication, catalog, cart, discount codes, "
            "mock payment tokens (`tok_charge_success`, `tok_charge_declined`), order confirmation, "
            "and email audit records. Interactive docs expose every route documented by YAML snippets "
            "in Flask view docstrings."
        ),
        "tags": [
            {"name": "System", "description": "Health checks"},
            {"name": "Auth", "description": "Register, login, and session"},
            {"name": "Users", "description": "Profile (`/api/users/me`)"},
            {"name": "Products", "description": "Product catalog"},
            {"name": "Cart", "description": "Cart lines & discount"},
            {"name": "Orders", "description": "History & checkout"},
            {"name": "Notifications", "description": "Email notification log"},
        ],
        "securityDefinitions": {
            "Bearer": {
                "type": "apiKey",
                "name": "Authorization",
                "in": "header",
                "description": "JWT access token; format: `Bearer <token>`",
            }
        },
    }

    from app.models import (  # noqa: F401
        Cart,
        CartItem,
        DiscountCode,
        EmailNotification,
        Order,
        OrderItem,
        Product,
        User,
    )
    from app.routes.auth import bp as auth_bp
    from app.routes.cart import bp as cart_bp
    from app.routes.notifications import bp as notifications_bp
    from app.routes.orders import bp as orders_bp
    from app.routes.products import bp as products_bp
    from app.routes.users import bp as users_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(products_bp)
    app.register_blueprint(cart_bp)
    app.register_blueprint(orders_bp)
    app.register_blueprint(notifications_bp)

    @app.route("/health")
    def health():
        """
        Liveness probe used by dashboards and infra.
        ---
        tags:
          - System
        responses:
          200:
            description: Service is reachable
            schema:
              type: object
              properties:
                status:
                  type: string
                  example: ok
                service:
                  type: string
                  example: ecommerce-api
        """
        return {"status": "ok", "service": "ecommerce-api"}

    swagger_path = os.path.join(os.path.dirname(__file__), "swagger", "template.yaml")
    if os.path.isfile(swagger_path) and not app.config.get("TESTING"):
        Swagger(app, template_file=swagger_path)

    @app.cli.command("init-db")
    def init_db():
        db.create_all()
        print("Database initialized.")

    @app.cli.command("seed-shop")
    def seed_shop():
        from datetime import datetime, timedelta

        from app.models.discount import DiscountCode
        from app.models.product import Product

        db.create_all()

        if not Product.query.first():
            rows = [
                Product(
                    sku="MUG-001",
                    title="Ceramic Mug",
                    description="12oz matte ceramic mug.",
                    price_cents=1499,
                    stock_qty=100,
                    image_url="https://placehold.co/400x320/f4f4f5/71717b?text=Mug",
                ),
                Product(
                    sku="TSHIRT-BLUE",
                    title="Organic Tee — Blue",
                    description="Fair-trade cotton t-shirt.",
                    price_cents=2999,
                    stock_qty=50,
                    image_url="https://placehold.co/400x320/e0e7ff/4338ca?text=Tee",
                ),
                Product(
                    sku="BAG-TOTE",
                    title="Canvas Tote",
                    description="Heavy-duty market tote.",
                    price_cents=2499,
                    stock_qty=30,
                    image_url="https://placehold.co/400x320/ffedd5/c2410c?text=Tote",
                ),
                Product(
                    sku="NB-001",
                    title="Layflat Notebook",
                    description="Dot grid notebook, recycled paper.",
                    price_cents=1299,
                    stock_qty=0,
                    active=False,
                    image_url="https://placehold.co/400x320/dcfce7/166534?text=Sold+out",
                ),
            ]
            for r in rows:
                db.session.add(r)

        if not DiscountCode.query.first():
            db.session.add_all(
                [
                    DiscountCode(
                        code="SAVE10",
                        percent_off=10,
                        amount_off_cents=None,
                        min_subtotal_cents=2000,
                        max_uses=None,
                    ),
                    DiscountCode(
                        code="WELCOME5",
                        percent_off=None,
                        amount_off_cents=500,
                        min_subtotal_cents=1500,
                        max_uses=500,
                    ),
                    DiscountCode(
                        code="EXPIRED88",
                        percent_off=88,
                        amount_off_cents=None,
                        min_subtotal_cents=0,
                        valid_until=datetime.utcnow() - timedelta(days=1),
                    ),
                ]
            )

        db.session.commit()
        prod_count = Product.query.count()
        code_count = DiscountCode.query.count()
        print(f"Shop catalog ready: {prod_count} products, {code_count} discount rows.")

    return app
