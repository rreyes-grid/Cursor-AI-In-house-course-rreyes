"""
Run the Blogging Platform API.

Usage:
  cd blogging_api
  python -m venv .venv && source .venv/bin/activate
  pip install -r requirements.txt
  export FLASK_APP=run.py
  flask init-db
  python run.py
"""

import os

from app import create_app

app = create_app(os.environ.get("FLASK_ENV", "development"))  # noqa: F401 — Flask CLI

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5003))
    app.run(host="0.0.0.0", port=port, debug=True)
