def user_public(u):
    return {
        "id": u.id,
        "name": u.name,
        "email": u.email,
        "role": u.role,
        "availability_status": u.availability_status,
        "expertise_areas": u.expertise_areas or [],
        "created_at": u.created_at.isoformat() if u.created_at else None,
    }


def ticket_summary(t):
    return {
        "id": t.id,
        "ticket_number": t.ticket_number,
        "subject": t.subject,
        "status": t.status,
        "priority": t.priority,
        "category": t.category,
        "customer_email": t.customer_email,
        "customer_id": t.customer_id,
        "assigned_to_id": t.assigned_to_id,
        "created_at": t.created_at.isoformat() if t.created_at else None,
        "updated_at": t.updated_at.isoformat() if t.updated_at else None,
        "response_due_at": t.response_due_at.isoformat() if t.response_due_at else None,
        "resolution_due_at": t.resolution_due_at.isoformat() if t.resolution_due_at else None,
        "sla_response_breached": t.sla_response_breached,
        "sla_resolution_breached": t.sla_resolution_breached,
        "escalated": t.escalated,
    }


def ticket_detail(t):
    d = ticket_summary(t)
    d["description"] = t.description
    d["resolved_at"] = t.resolved_at.isoformat() if t.resolved_at else None
    d["closed_at"] = t.closed_at.isoformat() if t.closed_at else None
    d["first_response_at"] = t.first_response_at.isoformat() if t.first_response_at else None
    return d


def comment_public(c, include_internal: bool):
    if c.is_internal and not include_internal:
        return None
    return {
        "id": c.id,
        "ticket_id": c.ticket_id,
        "user_id": c.user_id,
        "user_name": c.user.name if c.user else None,
        "content": c.content,
        "is_internal": c.is_internal,
        "created_at": c.created_at.isoformat() if c.created_at else None,
    }


def history_row(h):
    return {
        "id": h.id,
        "action": h.action,
        "from_value": h.from_value,
        "to_value": h.to_value,
        "note": h.note,
        "user_id": h.user_id,
        "created_at": h.created_at.isoformat() if h.created_at else None,
    }


def attachment_row(a):
    return {
        "id": a.id,
        "filename": a.filename,
        "file_size": a.file_size,
        "file_type": a.file_type,
        "uploaded_at": a.uploaded_at.isoformat() if a.uploaded_at else None,
    }


def notification_row(n):
    return {
        "id": n.id,
        "message": n.message,
        "read": n.read,
        "ticket_id": n.ticket_id,
        "created_at": n.created_at.isoformat() if n.created_at else None,
    }
