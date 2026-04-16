"""Generate TICK-YYYYMMDD-XXXX (FR-002)."""
from datetime import datetime, timezone

from sqlalchemy import func

from app.extensions import db
from app.models import Ticket


def next_ticket_number() -> str:
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    prefix = f"TICK-{today}-"
    # Count tickets today for sequence
    n = (
        db.session.query(func.count(Ticket.id))
        .filter(Ticket.ticket_number.like(f"{prefix}%"))
        .scalar()
    )
    seq = (n or 0) + 1
    return f"{prefix}{seq:04d}"
