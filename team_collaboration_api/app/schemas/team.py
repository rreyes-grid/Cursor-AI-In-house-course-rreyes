from marshmallow import Schema, fields, validate


class TeamMemberSchema(Schema):
    user_id = fields.Int(required=True)
    role = fields.Str(missing="member", validate=validate.Length(max=40))


class TeamSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    slug = fields.Str(required=True)
    description = fields.Str(allow_none=True)
    created_by_id = fields.Int(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    member_ids = fields.List(fields.Int(), dump_only=True)


class TeamCreateSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=1, max=160))
    slug = fields.Str(required=True, validate=validate.Length(min=2, max=120))
    description = fields.Str(allow_none=True)
