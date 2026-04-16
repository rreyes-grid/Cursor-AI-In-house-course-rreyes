"""Ticket status transitions (FR-012)."""
from datetime import datetime, timezone

VALID_STATUSES = frozenset(
    {
        "open",
        "assigned",
        "in_progress",
        "waiting",
        "resolved",
        "closed",
        "reopened",
    }
)

_ALLOWED = {
    "open": frozenset({"assigned", "closed"}),
    "assigned": frozenset({"in_progress", "closed"}),
    "in_progress": frozenset({"waiting", "resolved", "closed"}),
    "waiting": frozenset({"in_progress"}),
    "resolved": frozenset({"closed", "reopened"}),
    "closed": frozenset({"reopened"}),  # restricted by 7-day rule in caller
    "reopened": frozenset({"in_progress"}),
}


def can_transition(
    from_status: str, to_status: str, closed_at: datetime | None, now: datetime | None = None
) -> tuple[bool, str | None]:
    if from_status not in VALID_STATUSES or to_status not in VALID_STATUSES:
        return False, "Invalid status value"
    if from_status == to_status:
        return True, None
    allowed = _ALLOWED.get(from_status, frozenset())
    if to_status not in allowed:
        return False, f"Cannot change status from {from_status} to {to_status}"
    if from_status == "closed" and to_status == "reopened":
        if closed_at is None:
            return False, "Missing closed timestamp"
        now = now or datetime.now(timezone.utc)
        if closed_at.tzinfo is None:
            closed_at = closed_at.replace(tzinfo=timezone.utc)
        if (now - closed_at).days > 7:
            return False, "Ticket can only be reopened within 7 days of closing"
    return True, None
