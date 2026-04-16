"""Auto-assign by workload and category expertise (FR-006)."""
from sqlalchemy import func

from app.extensions import db
from app.models import Ticket, User


def pick_agent_for_category(category: str) -> User | None:
    """Choose agent with fewest open non-closed tickets, preferring category in expertise."""
    agents = User.query.filter(User.role == "agent").all()
    if not agents:
        agents = User.query.filter(User.role == "admin").all()
    if not agents:
        return None

    def open_count(uid: int) -> int:
        return (
            Ticket.query.filter(
                Ticket.assigned_to_id == uid,
                Ticket.status.notin_(["closed", "resolved"]),
            ).count()
        )

    def score(u: User) -> tuple:
        cat_match = 1 if category in (u.expertise_areas or []) else 0
        avail = {"available": 2, "busy": 1, "offline": 0}.get(u.availability_status, 0)
        return (-cat_match, -avail, open_count(u.id))

    return sorted(agents, key=score)[0]
