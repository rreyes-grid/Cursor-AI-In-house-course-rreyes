import csv
import io
from datetime import timezone

from flask import Blueprint, Response, jsonify, request
from sqlalchemy import func

from app.decorators import roles_required
from app.extensions import db
from app.models import Ticket, User
from app.services.sla_flags import refresh_sla_flags

bp = Blueprint("admin", __name__, url_prefix="/api/admin")


def _build_dashboard_payload():
    total = Ticket.query.count()
    by_status = dict(
        db.session.query(Ticket.status, func.count(Ticket.id)).group_by(Ticket.status).all()
    )
    by_priority = dict(
        db.session.query(Ticket.priority, func.count(Ticket.id)).group_by(Ticket.priority).all()
    )
    by_category = dict(
        db.session.query(Ticket.category, func.count(Ticket.id)).group_by(Ticket.category).all()
    )

    resolved = Ticket.query.filter(Ticket.resolved_at.isnot(None)).all()
    avg_hours = None
    if resolved:
        deltas = []
        for t in resolved:
            if t.created_at and t.resolved_at:
                ca = t.created_at
                ra = t.resolved_at
                if ca.tzinfo is None:
                    ca = ca.replace(tzinfo=timezone.utc)
                if ra.tzinfo is None:
                    ra = ra.replace(tzinfo=timezone.utc)
                deltas.append((ra - ca).total_seconds() / 3600)
        if deltas:
            avg_hours = round(sum(deltas) / len(deltas), 2)

    agents = User.query.filter(User.role.in_(["agent", "admin"])).all()
    agent_stats = []
    for a in agents:
        assigned = Ticket.query.filter(Ticket.assigned_to_id == a.id).count()
        open_cnt = Ticket.query.filter(
            Ticket.assigned_to_id == a.id,
            Ticket.status.notin_(["closed", "resolved"]),
        ).count()
        agent_stats.append(
            {
                "user_id": a.id,
                "name": a.name,
                "assigned_total": assigned,
                "open_assigned": open_cnt,
            }
        )

    breached = Ticket.query.filter(
        (Ticket.sla_response_breached == True) | (Ticket.sla_resolution_breached == True)  # noqa: E712
    ).count()
    sla_total = max(Ticket.query.count(), 1)
    sla_rate = round(100 * (1 - breached / sla_total), 2)

    return {
        "total_tickets": total,
        "by_status": by_status,
        "by_priority": by_priority,
        "by_category": by_category,
        "average_resolution_hours": avg_hours,
        "agent_performance": agent_stats,
        "sla_compliance_percent": sla_rate,
        "sla_breached_count": breached,
    }


@bp.route("/dashboard", methods=["GET"])
@roles_required("admin")
def dashboard():
    return jsonify({"status": "success", "dashboard": _build_dashboard_payload()})


@bp.route("/reports/tickets", methods=["GET"])
@roles_required("admin")
def report_tickets():
    df = request.args.get("date_from")
    q = Ticket.query
    if df:
        q = q.filter(Ticket.created_at >= df)
    rows = q.order_by(Ticket.created_at.desc()).limit(500).all()
    out = []
    for t in rows:
        refresh_sla_flags(t)
        out.append(
            {
                "ticket_number": t.ticket_number,
                "status": t.status,
                "priority": t.priority,
                "category": t.category,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
        )
    db.session.commit()
    return jsonify({"status": "success", "tickets": out})


@bp.route("/reports/agents", methods=["GET"])
@roles_required("admin")
def report_agents():
    return jsonify({"status": "success", "dashboard": _build_dashboard_payload()})


@bp.route("/reports/sla", methods=["GET"])
@roles_required("admin")
def report_sla():
    total = Ticket.query.count()
    breached = Ticket.query.filter(
        (Ticket.sla_response_breached == True) | (Ticket.sla_resolution_breached == True)  # noqa: E712
    ).count()
    return jsonify(
        {
            "status": "success",
            "sla": {
                "total_tickets": total,
                "breached": breached,
                "compliance_percent": round(100 * (1 - breached / max(total, 1)), 2),
            },
        }
    )


@bp.route("/reports/export", methods=["GET"])
@roles_required("admin")
def export_report():
    report_type = request.args.get("type", "tickets")
    si = io.StringIO()
    w = csv.writer(si)
    if report_type == "tickets":
        w.writerow(
            ["ticket_number", "subject", "status", "priority", "category", "customer_email", "created_at"]
        )
        for t in Ticket.query.order_by(Ticket.id).all():
            w.writerow(
                [
                    t.ticket_number,
                    t.subject,
                    t.status,
                    t.priority,
                    t.category,
                    t.customer_email,
                    t.created_at.isoformat() if t.created_at else "",
                ]
            )
    else:
        w.writerow(["error", "message"])
        w.writerow(["unknown_type", "Use type=tickets"])
    return Response(
        si.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=export.csv"},
    )
