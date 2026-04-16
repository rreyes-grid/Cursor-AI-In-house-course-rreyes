from flask import Blueprint, g, jsonify, request

from app.decorators import jwt_user_required
from app.errors import ApiError
from app.extensions import db
from app.models import Ticket, User
from app.schemas import AgentAvailabilitySchema
from app.serializers import user_public, ticket_summary

bp = Blueprint("agents", __name__, url_prefix="/api/agents")


@bp.route("", methods=["GET"])
@jwt_user_required
def list_agents():
    agents = User.query.filter(User.role.in_(["agent", "admin"])).order_by(User.name).all()
    return jsonify({"status": "success", "agents": [user_public(a) for a in agents]})


@bp.route("/<int:agent_id>/tickets", methods=["GET"])
@jwt_user_required
def agent_tickets(agent_id: int):
    if g.current_user.role != "admin" and g.current_user.id != agent_id:
        raise ApiError("Forbidden", 403, "FORBIDDEN")
    User.query.get_or_404(agent_id)
    q = Ticket.query.filter(Ticket.assigned_to_id == agent_id).order_by(Ticket.updated_at.desc())
    return jsonify(
        {
            "status": "success",
            "tickets": [ticket_summary(t) for t in q.all()],
        }
    )


@bp.route("/<int:agent_id>/availability", methods=["PUT"])
@jwt_user_required
def update_availability(agent_id: int):
    if g.current_user.role != "admin" and g.current_user.id != agent_id:
        raise ApiError("Forbidden", 403, "FORBIDDEN")
    u = User.query.get_or_404(agent_id)
    if u.role not in ("agent", "admin"):
        raise ApiError("User is not an agent", 400)
    data = AgentAvailabilitySchema().load(request.get_json(force=True, silent=True) or {})
    u.availability_status = data["availability_status"]
    db.session.commit()
    return jsonify({"status": "success", "user": user_public(u)})
