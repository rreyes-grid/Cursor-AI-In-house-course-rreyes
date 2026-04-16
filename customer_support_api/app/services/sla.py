"""SLA due times per PRD FR-020 (hours for response, hours for resolution)."""
from datetime import datetime, timedelta
from typing import Tuple

# (response_hours, resolution_hours)
SLA_MAP = {
    "urgent": (2, 24),
    "high": (4, 48),
    "medium": (8, 5 * 24),
    "low": (24, 10 * 24),
}


def compute_sla_deadlines(
    created_at: datetime, priority: str
) -> Tuple[datetime, datetime]:
    rh, res_h = SLA_MAP.get(priority, SLA_MAP["medium"])
    return created_at + timedelta(hours=rh), created_at + timedelta(hours=res_h)


def recompute_sla_on_priority_change(
    created_at: datetime, new_priority: str, now: datetime | None = None
) -> Tuple[datetime, datetime]:
    """Recalculate resolution/response windows from creation time when priority changes."""
    _ = now  # could anchor "remaining" SLA — PRD uses fixed windows from creation
    return compute_sla_deadlines(created_at, new_priority)
