import os

from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS
from flasgger import Swagger

from app.config import config_by_name
from app.errors import register_error_handlers
from app.extensions import db, init_celery, jwt, socketio, register_extensions


def create_app(config_name=None):
    load_dotenv()
    app = Flask(__name__)
    cfg = config_name or os.environ.get("FLASK_ENV", "development")
    app.config.from_object(config_by_name.get(cfg, config_by_name["default"]))

    # CORS
    origins = app.config.get("CORS_ORIGINS", ["http://localhost:5173"])
    if isinstance(origins, str):
        origins = [o.strip() for o in origins.split(",")]
    CORS(app, resources={r"/api/*": {"origins": origins}}, supports_credentials=True)

    register_extensions(app)
    init_celery(app)
    register_error_handlers(app)

    # Swagger UI
    app.config["SWAGGER"] = {
        "title": "Team Collaboration API",
        "version": "1.0.0",
        "description": "JWT authentication, projects, tasks, teams, notifications, and Socket.IO real-time events.",
        "tags": [
            {"name": "Auth", "description": "Register, login, current user"},
            {"name": "Projects", "description": "Project CRUD and members"},
            {"name": "Tasks", "description": "Task CRUD per project"},
            {"name": "Teams", "description": "Teams and members"},
            {"name": "Notifications", "description": "User notifications"},
            {"name": "Collaboration", "description": "Activity and presence"},
        ],
    }
    swagger_path = os.path.join(os.path.dirname(__file__), "swagger", "template.yaml")
    if os.path.isfile(swagger_path):
        Swagger(app, template_file=swagger_path)
    else:
        Swagger(app)

    # Models (register with SQLAlchemy)
    from app import models  # noqa: F401

    # Blueprints
    from app.routes import auth, projects, tasks, teams, notifications, collaboration

    app.register_blueprint(auth.bp)
    app.register_blueprint(projects.bp)
    app.register_blueprint(tasks.bp)
    app.register_blueprint(teams.bp)
    app.register_blueprint(notifications.bp)
    app.register_blueprint(collaboration.bp)

    # Socket.IO
    from app import socket_events  # noqa: F401

    @app.route("/health")
    def health():
        return {"status": "ok", "service": "team-collaboration-api"}

    @app.cli.command("init-db")
    def init_db():
        """Create tables."""
        db.create_all()
        print("Database initialized.")

    return app
