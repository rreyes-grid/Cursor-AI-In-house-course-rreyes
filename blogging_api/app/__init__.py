import os

from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS
from flasgger import Swagger

from app.config import config_by_name
from app.errors import register_error_handlers
from app.extensions import db, jwt, register_extensions


def _register_jwt_loaders(app):
    @jwt.unauthorized_loader
    def missing_token(_err):
        return jsonify({"error": True, "message": "Authorization required"}), 401

    @jwt.invalid_token_loader
    def invalid_token(err):
        return jsonify({"error": True, "message": str(err)}), 401

    @jwt.expired_token_loader
    def expired_token(_jwt_header, _jwt_payload):
        return jsonify({"error": True, "message": "Token has expired"}), 401


def create_app(config_name=None):
    load_dotenv()
    app = Flask(__name__)
    cfg = config_name or os.environ.get("FLASK_ENV", "development")
    app.config.from_object(config_by_name.get(cfg, config_by_name["default"]))

    origins = app.config.get("CORS_ORIGINS", ["http://localhost:5173"])
    if isinstance(origins, str):
        origins = [o.strip() for o in origins.split(",")]
    CORS(app, resources={r"/api/*": {"origins": origins}}, supports_credentials=True)

    register_extensions(app)
    _register_jwt_loaders(app)
    register_error_handlers(app)

    app.config["SWAGGER"] = {
        "title": "Blogging Platform API",
        "version": "1.0.0",
        "description": (
            "JWT authentication, blog posts, comments, categories, and keyword search. "
            "Post list and detail responses are cached (Redis when `REDIS_URL` is set; otherwise in-process). "
            "Use **Authorize** with `Bearer <access_token>` from /api/auth/login or /api/auth/register."
        ),
        "tags": [
            {"name": "Auth", "description": "Register and login"},
            {"name": "Posts", "description": "Post CRUD"},
            {"name": "Comments", "description": "Comments on posts"},
            {"name": "Categories", "description": "Category management"},
            {"name": "Search", "description": "Search posts by keyword"},
        ],
        "securityDefinitions": {
            "Bearer": {
                "type": "apiKey",
                "name": "Authorization",
                "in": "header",
                "description": "JWT access token: `Bearer <token>`",
            }
        },
    }
    swagger_path = os.path.join(os.path.dirname(__file__), "swagger", "template.yaml")
    if os.path.isfile(swagger_path):
        Swagger(app, template_file=swagger_path)
    else:
        Swagger(app)

    from app import models  # noqa: F401

    from app.routes import auth, categories, posts, search

    app.register_blueprint(auth.bp)
    app.register_blueprint(posts.bp)
    app.register_blueprint(categories.bp)
    app.register_blueprint(search.bp)

    @app.route("/health")
    def health():
        return {"status": "ok", "service": "blogging-api"}

    @app.cli.command("init-db")
    def init_db():
        """Create database tables."""
        db.create_all()
        print("Database initialized.")

    return app
