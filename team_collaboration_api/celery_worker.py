"""
Celery worker entrypoint.

  cd team_collaboration_api && source .venv/bin/activate
  celery -A celery_worker.celery worker --loglevel=info

You should see collab.celery logs: worker_init, worker_ready, then per-task START/END.
"""

import logging
import os

from app import create_app
from app.extensions import celery

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

create_app(os.environ.get("FLASK_ENV", "development"))
