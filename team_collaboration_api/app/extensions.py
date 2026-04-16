import logging

from celery import Celery
from flask_caching import Cache
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
jwt = JWTManager()
socketio = SocketIO(async_mode="eventlet")
cache = Cache()
celery = Celery("team_collab")


def _fallback_if_redis_unreachable(app) -> None:
    """Avoid Error 61 when REDIS_URL is set but no server is listening."""
    url = (app.config.get("REDIS_URL") or "").strip()
    if not url:
        return
    try:
        import redis

        r = redis.from_url(url, socket_connect_timeout=1.0, socket_timeout=1.0)
        r.ping()
    except Exception as exc:  # ConnectionError, TimeoutError, OSError, etc.
        app.logger.warning(
            "Redis unreachable (%s); using SimpleCache and Socket.IO without "
            "message_queue (in-process emits only). Start Redis or unset REDIS_URL. %s",
            url,
            exc,
        )
        app.config["REDIS_URL"] = ""
        app.config["CACHE_TYPE"] = "SimpleCache"
        app.config["CACHE_REDIS_URL"] = None


def register_extensions(app):
    db.init_app(app)
    jwt.init_app(app)
    _fallback_if_redis_unreachable(app)
    cache.init_app(app)

    cors = app.config.get("CORS_ORIGINS", "*")
    if isinstance(cors, str) and cors != "*":
        cors = [x.strip() for x in cors.split(",")]
    mq = (app.config.get("REDIS_URL") or "").strip() or None
    socketio.init_app(
        app,
        cors_allowed_origins=cors if cors else "*",
        async_mode="eventlet",
        message_queue=mq,
    )


def init_celery(app):
    """Bind Celery to Flask config and app context for tasks."""
    # Tasks are registered once on first import; do not close over a stale ``app``
    # when tests call ``create_app`` multiple times (each inits Celery again).
    celery.flask_app = app  # type: ignore[attr-defined]
    log = logging.getLogger("collab.celery")
    eager = app.config.get("CELERY_TASK_ALWAYS_EAGER", False)
    celery.conf.update(
        broker_url=app.config["CELERY_BROKER_URL"],
        result_backend=app.config["CELERY_RESULT_BACKEND"],
        task_serializer="json",
        accept_content=["json"],
        result_serializer="json",
        task_ignore_result=False,
        task_always_eager=eager,
        task_eager_propagates=True,
    )
    log.info(
        "Celery app configured: broker=%s result_backend=%s task_always_eager=%s",
        app.config["CELERY_BROKER_URL"],
        app.config["CELERY_RESULT_BACKEND"],
        eager,
    )
    if eager:
        log.info(
            "Celery eager mode: tasks run in the Flask process (no separate worker)."
        )

    class ContextTask(celery.Task):
        abstract = True

        def __call__(self, *args, **kwargs):
            flask_app = getattr(celery, "flask_app", None)
            if flask_app is None:
                raise RuntimeError("Celery is not bound to a Flask app (init_celery not run)")
            with flask_app.app_context():
                return self.run(*args, **kwargs)

    celery.Task = ContextTask

    from app import worker_tasks  # noqa: F401

    return celery
