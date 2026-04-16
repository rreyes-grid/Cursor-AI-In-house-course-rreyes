import os
from datetime import datetime, timezone
from uuid import uuid4

from flask import Blueprint, g, jsonify, request
from sqlalchemy import and_, or_

from app.decorators import jwt_user_required, roles_required
from app.errors import ApiError
from app.extensions import db
from app.models import (
    Assignment,
    Attachment,
    Comment,
    PriorityChange,
    Ticket,
    TicketHistory,
    User,
)
from app.schemas import (
    CommentCreateSchema,
    TicketAssignSchema,
    TicketCreateSchema,
    TicketPrioritySchema,
    TicketStatusSchema,
    TicketUpdateSchema,
)
from app.serializers import (
    attachment_row,
    comment_public,
    history_row,
    ticket_detail,
    ticket_summary,
)
from app.services.auto_assign import pick_agent_for_category
from app.services.email_stub import send_email
from app.services.notifications import notify_user
from app.services.sla import compute_sla_deadlines
from app.services.sla_flags import refresh_sla_flags
from app.services.status_rules import can_transition
from app.services.ticket_number import next_ticket_number
from app.utils_text import sanitize_user_text, validate_subject_pattern

bp = Blueprint("tickets", __name__, url_prefix="/api/tickets")

ALLOWED_EXT = {".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"}
MAX_FILE_SIZE = 5 * 1024 * 1024
MAX_FILES_PER_TICKET = 3


def _agent_can_view(ticket: Ticket, user: User) -> bool:
    if ticket.assigned_to_id == user.id:
        return True
    return ticket.status == "open" and ticket.assigned_to_id is None


def can_view_ticket(ticket: Ticket, user: User) -> bool:
    if user.role == "admin":
        return True
    if user.role == "customer":
        return ticket.customer_id == user.id
    if user.role == "agent":
        return _agent_can_view(ticket, user)
    return False


def can_edit_ticket(ticket: Ticket, user: User) -> bool:
    return user.role in ("admin", "agent")


@bp.route("", methods=["GET"])
@jwt_user_required
def list_tickets():
    u = g.current_user
    q = Ticket.query

    if u.role == "customer":
        q = q.filter(Ticket.customer_id == u.id)
    elif u.role == "agent":
        q = q.filter(
            or_(
                Ticket.assigned_to_id == u.id,
                and_(Ticket.status == "open", Ticket.assigned_to_id.is_(None)),
            )
        )

    text = request.args.get("q")
    if text:
        like = f"%{text}%"
        q = q.filter(
            or_(
                Ticket.subject.ilike(like),
                Ticket.description.ilike(like),
                Ticket.ticket_number.ilike(like),
                Ticket.customer_email.ilike(like),
            )
        )

    st = request.args.get("status")
    if st:
        statuses = [s.strip() for s in st.split(",") if s.strip()]
        if statuses:
            q = q.filter(Ticket.status.in_(statuses))

    pr = request.args.get("priority")
    if pr:
        q = q.filter(Ticket.priority == pr)

    cat = request.args.get("category")
    if cat:
        q = q.filter(Ticket.category == cat)

    assigned = request.args.get("assigned_to")
    if assigned and u.role == "admin":
        if assigned == "unassigned":
            q = q.filter(Ticket.assigned_to_id.is_(None))
        else:
            q = q.filter(Ticket.assigned_to_id == int(assigned))

    df = request.args.get("date_from")
    dt_to = request.args.get("date_to")
    if df:
        q = q.filter(Ticket.created_at >= df)
    if dt_to:
        q = q.filter(Ticket.created_at <= dt_to + "T23:59:59")

    unassigned = request.args.get("unassigned")
    if unassigned == "true" and u.role in ("admin", "agent"):
        q = q.filter(Ticket.assigned_to_id.is_(None))

    q = q.order_by(Ticket.updated_at.desc())
    page = max(1, int(request.args.get("page", 1)))
    per_page = min(100, max(1, int(request.args.get("per_page", 20))))
    paginated = q.paginate(page=page, per_page=per_page, error_out=False)
    items = []
    for t in paginated.items:
        refresh_sla_flags(t)
        items.append(ticket_summary(t))
    db.session.commit()

    return jsonify(
        {
            "status": "success",
            "tickets": items,
            "page": page,
            "per_page": per_page,
            "total": paginated.total,
            "pages": paginated.pages,
        }
    )


@bp.route("", methods=["POST"])
@jwt_user_required
def create_ticket():
    u = g.current_user
    data = TicketCreateSchema().load(request.get_json(force=True, silent=True) or {})
    subject = data["subject"].strip()
    if not validate_subject_pattern(subject):
        raise ApiError(
            "Subject must be 5–200 characters and use letters, numbers, and common punctuation only",
            400,
            errors={"subject": ["Invalid subject format"]},
        )
    desc = sanitize_user_text(data["description"], max_length=5000)
    if len(desc) < 20:
        raise ApiError("Description must be at least 20 characters", 400)

    now = datetime.now(timezone.utc)
    rd, resd = compute_sla_deadlines(now, data["priority"])
    num = next_ticket_number()
    ticket = Ticket(
        ticket_number=num,
        subject=subject,
        description=desc,
        status="open",
        priority=data["priority"],
        category=data["category"],
        customer_email=data["customer_email"].lower(),
        customer_id=u.id,
        response_due_at=rd,
        resolution_due_at=resd,
    )
    db.session.add(ticket)
    db.session.flush()

    h = TicketHistory(
        ticket_id=ticket.id,
        user_id=u.id,
        action="created",
        to_value="open",
    )
    db.session.add(h)

    if data.get("auto_assign"):
        agent = pick_agent_for_category(data["category"])
        if agent:
            ticket.assigned_to_id = agent.id
            ticket.status = "assigned"
            db.session.add(
                Assignment(
                    ticket_id=ticket.id,
                    assigned_to_id=agent.id,
                    assigned_by_id=None,
                )
            )
            db.session.add(
                TicketHistory(
                    ticket_id=ticket.id,
                    user_id=u.id,
                    action="assigned",
                    from_value="open",
                    to_value="assigned",
                    note=f"Auto-assigned to agent {agent.id}",
                )
            )
            if agent.notification_email:
                send_email(
                    agent.email,
                    f"Ticket {num} assigned to you",
                    f"You have been assigned ticket {num}: {subject}",
                )
            notify_user(agent.id, f"Ticket {num} assigned to you", ticket.id)

    db.session.commit()

    send_email(
        ticket.customer_email,
        f"Ticket {num} received",
        f"Your support ticket {num} has been created. Subject: {subject}",
    )

    refresh_sla_flags(ticket)
    db.session.commit()

    return jsonify({"status": "success", "ticket": ticket_detail(ticket)}), 201


@bp.route("/<int:ticket_id>", methods=["GET"])
@jwt_user_required
def get_ticket(ticket_id: int):
    t = Ticket.query.get_or_404(ticket_id)
    if not can_view_ticket(t, g.current_user):
        raise ApiError("Forbidden", 403, "FORBIDDEN")
    refresh_sla_flags(t)
    db.session.commit()
    return jsonify({"status": "success", "ticket": ticket_detail(t)})


@bp.route("/<int:ticket_id>", methods=["PUT"])
@jwt_user_required
def update_ticket(ticket_id: int):
    t = Ticket.query.get_or_404(ticket_id)
    if not can_view_ticket(t, g.current_user):
        raise ApiError("Forbidden", 403, "FORBIDDEN")
    if not can_edit_ticket(t, g.current_user):
        raise ApiError("Only agents and admins can update tickets", 403, "FORBIDDEN")
    data = TicketUpdateSchema().load(request.get_json(force=True, silent=True) or {}, partial=True)
    if "subject" in data:
        sub = data["subject"].strip()
        if not validate_subject_pattern(sub):
            raise ApiError("Invalid subject", 400)
        t.subject = sub
    if "description" in data:
        desc = sanitize_user_text(data["description"], max_length=5000)
        if len(desc) < 20:
            raise ApiError("Description too short", 400)
        t.description = desc
    db.session.add(
        TicketHistory(
            ticket_id=t.id,
            user_id=g.current_user.id,
            action="updated",
            note="Ticket fields updated",
        )
    )
    db.session.commit()
    return jsonify({"status": "success", "ticket": ticket_detail(t)})


@bp.route("/<int:ticket_id>", methods=["DELETE"])
@roles_required("admin")
def delete_ticket(ticket_id: int):
    t = Ticket.query.get_or_404(ticket_id)
    db.session.delete(t)
    db.session.commit()
    return "", 204


@bp.route("/<int:ticket_id>/comments", methods=["GET"])
@jwt_user_required
def list_comments(ticket_id: int):
    t = Ticket.query.get_or_404(ticket_id)
    if not can_view_ticket(t, g.current_user):
        raise ApiError("Forbidden", 403, "FORBIDDEN")
    include_internal = g.current_user.role in ("agent", "admin")
    out = []
    for c in t.comments:
        row = comment_public(c, include_internal)
        if row:
            out.append(row)
    return jsonify({"status": "success", "comments": out})


@bp.route("/<int:ticket_id>/comments", methods=["POST"])
@jwt_user_required
def add_comment(ticket_id: int):
    t = Ticket.query.get_or_404(ticket_id)
    if not can_view_ticket(t, g.current_user):
        raise ApiError("Forbidden", 403, "FORBIDDEN")
    data = CommentCreateSchema().load(request.get_json(force=True, silent=True) or {})
    is_internal = data.get("is_internal", False)
    if is_internal and g.current_user.role == "customer":
        raise ApiError("Customers cannot add internal comments", 403, "FORBIDDEN")

    body = sanitize_user_text(data["content"], max_length=10000)
    if not body:
        raise ApiError("Comment cannot be empty", 400)

    now = datetime.now(timezone.utc)
    if g.current_user.role in ("agent", "admin") and t.first_response_at is None:
        t.first_response_at = now

    c = Comment(
        ticket_id=t.id,
        user_id=g.current_user.id,
        content=body,
        is_internal=is_internal,
        mentions=list(data.get("mention_user_ids") or []),
    )
    db.session.add(c)
    db.session.flush()

    # Notify mentioned users
    for uid in c.mentions or []:
        notify_user(uid, f"Mention in ticket {t.ticket_number}", t.id)

    # Email customer on public comment from staff
    if not is_internal and g.current_user.role in ("agent", "admin"):
        send_email(
            t.customer_email,
            f"Update on ticket {t.ticket_number}",
            f"New comment: {body[:500]}",
        )
    if not is_internal and g.current_user.role == "customer" and t.assignee:
        send_email(
            t.assignee.email,
            f"Customer replied on {t.ticket_number}",
            body[:500],
        )
        notify_user(t.assignee.id, f"New reply on ticket {t.ticket_number}", t.id)

    db.session.add(
        TicketHistory(
            ticket_id=t.id,
            user_id=g.current_user.id,
            action="comment",
            note="Comment added",
        )
    )
    db.session.commit()
    return jsonify({"status": "success", "comment": comment_public(c, True)}), 201


@bp.route("/<int:ticket_id>/status", methods=["PUT"])
@jwt_user_required
def update_status(ticket_id: int):
    t = Ticket.query.get_or_404(ticket_id)
    if not can_view_ticket(t, g.current_user):
        raise ApiError("Forbidden", 403, "FORBIDDEN")
    if g.current_user.role == "customer":
        raise ApiError("Customers cannot change status", 403, "FORBIDDEN")

    data = TicketStatusSchema().load(request.get_json(force=True, silent=True) or {})
    new_status = data["status"]
    if t.status == "open" and new_status == "assigned" and not t.assigned_to_id:
        raise ApiError(
            "Assign an agent before setting status to assigned",
            400,
        )
    ok, err = can_transition(t.status, new_status, t.closed_at)
    if not ok:
        raise ApiError(err or "Invalid transition", 400)

    old = t.status
    t.status = new_status
    now = datetime.now(timezone.utc)
    if new_status == "resolved":
        t.resolved_at = now
    if new_status == "closed":
        t.closed_at = now
    if new_status == "in_progress" and t.first_response_at is None:
        t.first_response_at = now

    db.session.add(
        TicketHistory(
            ticket_id=t.id,
            user_id=g.current_user.id,
            action="status_change",
            from_value=old,
            to_value=new_status,
        )
    )
    send_email(t.customer_email, f"Ticket {t.ticket_number} status: {new_status}", f"Status is now {new_status}.")
    if t.assignee:
        notify_user(t.assignee.id, f"Ticket {t.ticket_number} → {new_status}", t.id)
    db.session.commit()
    return jsonify({"status": "success", "ticket": ticket_detail(t)})


@bp.route("/<int:ticket_id>/priority", methods=["PUT"])
@jwt_user_required
def update_priority(ticket_id: int):
    t = Ticket.query.get_or_404(ticket_id)
    if not can_view_ticket(t, g.current_user):
        raise ApiError("Forbidden", 403, "FORBIDDEN")
    if g.current_user.role not in ("agent", "admin"):
        raise ApiError("Only agents and admins can change priority", 403, "FORBIDDEN")

    data = TicketPrioritySchema().load(request.get_json(force=True, silent=True) or {})
    old_p = t.priority
    new_p = data["priority"]
    reason = sanitize_user_text(data["reason"], max_length=2000)
    t.priority = new_p
    rd, resd = compute_sla_deadlines(t.created_at, new_p)
    t.response_due_at = rd
    t.resolution_due_at = resd

    db.session.add(
        PriorityChange(
            ticket_id=t.id,
            user_id=g.current_user.id,
            from_priority=old_p,
            to_priority=new_p,
            reason=reason,
        )
    )
    db.session.add(
        TicketHistory(
            ticket_id=t.id,
            user_id=g.current_user.id,
            action="priority_change",
            from_value=old_p,
            to_value=new_p,
            note=reason,
        )
    )
    db.session.commit()
    return jsonify({"status": "success", "ticket": ticket_detail(t)})


@bp.route("/<int:ticket_id>/assign", methods=["POST"])
@roles_required("admin")
def assign_ticket(ticket_id: int):
    t = Ticket.query.get_or_404(ticket_id)
    data = TicketAssignSchema().load(request.get_json(force=True, silent=True) or {})
    if data.get("auto"):
        agent = pick_agent_for_category(t.category)
        if not agent:
            raise ApiError("No agent available", 409)
    else:
        agent = User.query.get_or_404(data["agent_id"])
        if agent.role not in ("agent", "admin"):
            raise ApiError("Target user must be an agent or admin", 400)

    old_assignee = t.assigned_to_id
    t.assigned_to_id = agent.id
    if t.status == "open":
        t.status = "assigned"

    db.session.add(
        Assignment(
            ticket_id=t.id,
            assigned_to_id=agent.id,
            assigned_by_id=g.current_user.id,
        )
    )
    db.session.add(
        TicketHistory(
            ticket_id=t.id,
            user_id=g.current_user.id,
            action="assigned",
            from_value=str(old_assignee) if old_assignee else None,
            to_value=str(agent.id),
        )
    )
    send_email(agent.email, f"Ticket {t.ticket_number} assigned", f"You were assigned: {t.subject}")
    notify_user(agent.id, f"Assigned ticket {t.ticket_number}", t.id)
    db.session.commit()
    return jsonify({"status": "success", "ticket": ticket_detail(t)})


@bp.route("/<int:ticket_id>/history", methods=["GET"])
@jwt_user_required
def ticket_history(ticket_id: int):
    t = Ticket.query.get_or_404(ticket_id)
    if not can_view_ticket(t, g.current_user):
        raise ApiError("Forbidden", 403, "FORBIDDEN")
    rows = [history_row(h) for h in t.history]
    return jsonify({"status": "success", "history": rows})


@bp.route("/<int:ticket_id>/attachments", methods=["POST"])
@jwt_user_required
def upload_attachments(ticket_id: int):
    t = Ticket.query.get_or_404(ticket_id)
    if not can_view_ticket(t, g.current_user):
        raise ApiError("Forbidden", 403, "FORBIDDEN")

    if t.attachments and len(t.attachments) >= MAX_FILES_PER_TICKET:
        raise ApiError("Maximum attachment count reached", 400)

    f = request.files.get("file")
    if not f or not f.filename:
        raise ApiError("file is required", 400)

    ext = os.path.splitext(f.filename)[1].lower()
    if ext not in ALLOWED_EXT:
        raise ApiError("File type not allowed", 400)

    data_bytes = f.read()
    size = len(data_bytes)
    if size > MAX_FILE_SIZE:
        raise ApiError("File exceeds 5MB limit", 400)

    from flask import current_app

    upload_dir = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(upload_dir, exist_ok=True)
    safe_name = f"{uuid4().hex}{ext}"
    path = os.path.join(upload_dir, safe_name)
    with open(path, "wb") as out:
        out.write(data_bytes)

    att = Attachment(
        ticket_id=t.id,
        filename=f.filename[:255],
        stored_path=path,
        file_size=size,
        file_type=f.content_type or "application/octet-stream",
    )
    db.session.add(att)
    db.session.commit()
    return jsonify({"status": "success", "attachment": attachment_row(att)}), 201
