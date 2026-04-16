import os

from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS

from app.config import config_by_name
from app.errors import register_error_handlers
from app.extensions import db, register_extensions


def create_app(config_name=None):
    load_dotenv()
    app = Flask(__name__)
    cfg = config_name or os.environ.get("FLASK_ENV", "development")
    app.config.from_object(config_by_name.get(cfg, config_by_name["default"]))

    register_extensions(app)
    register_error_handlers(app)

    origins = app.config.get("CORS_ORIGINS", ["http://localhost:5173"])
    if isinstance(origins, str):
        origins = [o.strip() for o in origins.split(",")]
    CORS(app, resources={r"/api/*": {"origins": origins}}, supports_credentials=True)

    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    from app.models import (  # noqa: F401
        Assignment,
        Attachment,
        Comment,
        InAppNotification,
        PriorityChange,
        Ticket,
        TicketHistory,
        User,
    )
    from app.routes.admin import bp as admin_bp
    from app.routes.agents import bp as agents_bp
    from app.routes.auth import bp as auth_bp
    from app.routes.notifications import bp as notifications_bp
    from app.routes.tickets import bp as tickets_bp
    from app.routes.users import bp as users_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(tickets_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(agents_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(notifications_bp)

    @app.route("/health")
    def health():
        return {"status": "ok", "service": "customer-support-api"}

    @app.cli.command("init-db")
    def init_db():
        """Create database tables."""
        db.create_all()
        print("Database initialized.")

    @app.cli.command("seed-support")
    def seed_support():
        """Create demo admin, agents, and customer (password: Demo12345!)."""
        from app.models import User

        db.create_all()
        pwd = "Demo12345!"
        rounds = app.config.get("BCRYPT_ROUNDS", 12)

        def ensure_user(email, name, role, **extra):
            u = User.query.filter_by(email=email).first()
            if u:
                return u
            u = User(
                email=email,
                name=name,
                role=role,
                expertise_areas=extra.get("expertise_areas", []),
                availability_status=extra.get("availability_status", "available"),
            )
            u.set_password(pwd, rounds=rounds)
            db.session.add(u)
            return u

        ensure_user("admin@support.local", "Support Admin", "admin", expertise_areas=["technical", "billing"])
        ensure_user("agent1@support.local", "Agent One", "agent", expertise_areas=["technical", "general"])
        ensure_user("agent2@support.local", "Agent Two", "agent", expertise_areas=["billing", "general"])
        ensure_user("customer@support.local", "Demo Customer", "customer")
        db.session.commit()
        print("Seeded users (password for all: Demo12345!):")
        print("  admin@support.local (admin)")
        print("  agent1@support.local, agent2@support.local (agents)")
        print("  customer@support.local (customer)")

    return app
