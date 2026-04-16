from marshmallow import Schema, ValidationError, fields, validate, validates_schema
from marshmallow.validate import Email, Length, OneOf

CATEGORIES = ("technical", "billing", "general", "feature_request")
PRIORITIES = ("low", "medium", "high", "urgent")
STATUSES = (
    "open",
    "assigned",
    "in_progress",
    "waiting",
    "resolved",
    "closed",
    "reopened",
)


class TicketCreateSchema(Schema):
    subject = fields.Str(required=True, validate=Length(min=5, max=200))
    description = fields.Str(required=True, validate=Length(min=20, max=5000))
    priority = fields.Str(
        required=True, validate=OneOf(PRIORITIES)
    )
    category = fields.Str(
        required=True, validate=OneOf(CATEGORIES)
    )
    customer_email = fields.Email(required=True)
    auto_assign = fields.Bool(load_default=False)


class TicketUpdateSchema(Schema):
    subject = fields.Str(validate=Length(min=5, max=200))
    description = fields.Str(validate=Length(min=20, max=5000))


class TicketStatusSchema(Schema):
    status = fields.Str(required=True, validate=OneOf(STATUSES))


class TicketPrioritySchema(Schema):
    priority = fields.Str(required=True, validate=OneOf(PRIORITIES))
    reason = fields.Str(required=True, validate=Length(min=5, max=2000))


class TicketAssignSchema(Schema):
    agent_id = fields.Int(required=False, allow_none=True)
    auto = fields.Bool(load_default=False)

    @validates_schema
    def require_agent_or_auto(self, data, **kwargs):
        if data.get("auto"):
            return
        if data.get("agent_id") is None:
            raise ValidationError("agent_id is required when auto is false", "agent_id")


class CommentCreateSchema(Schema):
    content = fields.Str(required=True, validate=Length(min=1, max=10000))
    is_internal = fields.Bool(load_default=False)
    mention_user_ids = fields.List(fields.Int(), load_default=list)
