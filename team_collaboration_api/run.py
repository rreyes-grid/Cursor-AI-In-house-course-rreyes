"""
Run the Team Collaboration API with Socket.IO (eventlet).

Usage:
  cd team_collaboration_api
  python -m venv .venv && source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
  pip install -r requirements.txt
  export FLASK_APP=run.py
  flask init-db
  python run.py
"""

import os

from app import create_app
from app.extensions import socketio

app = create_app(os.environ.get("FLASK_ENV", "development"))  # noqa: F401 — used by Flask CLI


if __name__ == "__main__":
    # Default 5001: macOS often binds 5000 (AirPlay Receiver); set PORT=5000 if you prefer.
    port = int(os.environ.get("PORT", 5001))
    socketio.run(app, host="0.0.0.0", port=port, debug=True)
