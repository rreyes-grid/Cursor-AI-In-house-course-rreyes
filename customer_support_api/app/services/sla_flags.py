from datetime import datetime, timezone

from app.models import Ticket


def _aware(dt):
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def refresh_sla_flags(ticket: Ticket) -> None:
    """Update breach / escalation flags (FR-021, FR-022)."""
    now = datetime.now(timezone.utc)
    rd = _aware(ticket.response_due_at)
    resd = _aware(ticket.resolution_due_at)
    if ticket.first_response_at is None and rd and now > rd:
        ticket.sla_response_breached = True
    if ticket.status not in ("resolved", "closed") and resd and now > resd:
        ticket.sla_resolution_breached = True
    if ticket.sla_response_breached or ticket.sla_resolution_breached:
        ticket.escalated = True
