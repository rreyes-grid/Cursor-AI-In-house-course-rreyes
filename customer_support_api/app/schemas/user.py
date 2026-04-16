from marshmallow import Schema, fields, validate
from marshmallow.validate import Email, Length


class UserUpdateSchema(Schema):
    name = fields.Str(validate=Length(min=1, max=160))
    availability_status = fields.Str(
        validate=validate.OneOf(["available", "busy", "offline"])
    )
    expertise_areas = fields.List(fields.Str(), allow_none=True)
    notification_email = fields.Bool()
    notification_in_app = fields.Bool()


class AgentAvailabilitySchema(Schema):
    availability_status = fields.Str(
        required=True, validate=validate.OneOf(["available", "busy", "offline"])
    )
