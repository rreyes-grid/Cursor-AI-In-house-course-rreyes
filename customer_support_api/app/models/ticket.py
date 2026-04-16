from app.extensions import db


class Ticket(db.Model):
    __tablename__ = "support_tickets"

    id = db.Column(db.Integer, primary_key=True)
    ticket_number = db.Column(db.String(32), unique=True, nullable=False, index=True)
    subject = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(32), nullable=False, default="open", index=True)
    priority = db.Column(db.String(16), nullable=False, default="medium", index=True)
    category = db.Column(db.String(32), nullable=False, index=True)
    customer_email = db.Column(db.String(255), nullable=False, index=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("support_users.id"), nullable=False)
    assigned_to_id = db.Column(
        db.Integer, db.ForeignKey("support_users.id"), nullable=True, index=True
    )
    first_response_at = db.Column(db.DateTime, nullable=True)
    response_due_at = db.Column(db.DateTime, nullable=True, index=True)
    resolution_due_at = db.Column(db.DateTime, nullable=True, index=True)
    sla_response_breached = db.Column(db.Boolean, nullable=False, default=False)
    sla_resolution_breached = db.Column(db.Boolean, nullable=False, default=False)
    escalated = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now(), index=True)
    updated_at = db.Column(
        db.DateTime,
        server_default=db.func.now(),
        onupdate=db.func.now(),
    )
    resolved_at = db.Column(db.DateTime, nullable=True)
    closed_at = db.Column(db.DateTime, nullable=True)

    customer = db.relationship(
        "User",
        foreign_keys=[customer_id],
        back_populates="tickets_created",
    )
    assignee = db.relationship(
        "User",
        foreign_keys=[assigned_to_id],
        back_populates="tickets_assigned",
    )
    comments = db.relationship(
        "Comment",
        back_populates="ticket",
        order_by="Comment.created_at",
        cascade="all, delete-orphan",
    )
    assignments = db.relationship(
        "Assignment",
        back_populates="ticket",
        order_by="Assignment.assigned_at",
        cascade="all, delete-orphan",
    )
    attachments = db.relationship(
        "Attachment", back_populates="ticket", cascade="all, delete-orphan"
    )
    history = db.relationship(
        "TicketHistory",
        back_populates="ticket",
        order_by="TicketHistory.created_at",
        cascade="all, delete-orphan",
    )
    priority_changes = db.relationship(
        "PriorityChange",
        back_populates="ticket",
        cascade="all, delete-orphan",
    )
    in_app_notifications = db.relationship(
        "InAppNotification",
        back_populates="ticket",
        cascade="all, delete-orphan",
    )
