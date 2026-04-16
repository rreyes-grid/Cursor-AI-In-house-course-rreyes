from marshmallow import Schema, fields, validate


class ProjectSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    description = fields.Str(allow_none=True)
    due_date = fields.Date(allow_none=True)
    status = fields.Str(
        validate=validate.OneOf(["active", "archived", "on_hold"]), missing="active"
    )
    progress_trend = fields.Int(allow_none=True)
    owner_id = fields.Int(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    member_ids = fields.List(fields.Int(), dump_only=True)


class ProjectCreateSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    description = fields.Str(allow_none=True)
    due_date = fields.Date(allow_none=True)
    status = fields.Str(
        validate=validate.OneOf(["active", "archived", "on_hold"]), missing="active"
    )
    progress_trend = fields.Int(allow_none=True)


class ProjectUpdateSchema(Schema):
    name = fields.Str(validate=validate.Length(min=1, max=200))
    description = fields.Str(allow_none=True)
    due_date = fields.Date(allow_none=True)
    status = fields.Str(validate=validate.OneOf(["active", "archived", "on_hold"]))
    progress_trend = fields.Int(allow_none=True)
