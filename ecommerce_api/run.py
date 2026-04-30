"""
E-commerce API (Flask + SQLAlchemy + JWT).

  cd ecommerce_api
  python -m venv .venv && source .venv/bin/activate
  pip install -r requirements.txt
  cp .env.example .env
  export FLASK_APP=run.py
  flask init-db
  flask seed-shop
  python run.py
"""

import os

from app import create_app

app = create_app(os.environ.get("FLASK_ENV", "development"))  # noqa: F401

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5004))
    app.run(host="0.0.0.0", port=port, debug=True)
