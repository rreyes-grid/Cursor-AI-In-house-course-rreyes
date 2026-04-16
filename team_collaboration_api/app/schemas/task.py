from marshmallow import Schema, fields, validate


class TaskSchema(Schema):
    id = fields.Int(dump_only=True)
    project_id = fields.Int(required=True)
    title = fields.Str(required=True)
    description = fields.Str(allow_none=True)
    status = fields.Str(
        validate=validate.OneOf(["todo", "in_progress", "in_review", "done"]),
        missing="todo",
    )
    priority = fields.Str(
        validate=validate.OneOf(["low", "medium", "high", "urgent"]),
        missing="medium",
    )
    due_date = fields.Date(allow_none=True)
    assignee_id = fields.Int(allow_none=True)
    created_by_id = fields.Int(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class TaskCreateSchema(Schema):
    title = fields.Str(required=True, validate=validate.Length(min=1, max=300))
    description = fields.Str(allow_none=True)
    status = fields.Str(
        validate=validate.OneOf(["todo", "in_progress", "in_review", "done"]),
        missing="todo",
    )
    priority = fields.Str(
        validate=validate.OneOf(["low", "medium", "high", "urgent"]),
        missing="medium",
    )
    due_date = fields.Date(allow_none=True)
    assignee_id = fields.Int(allow_none=True)


class TaskUpdateSchema(Schema):
    title = fields.Str(validate=validate.Length(min=1, max=300))
    description = fields.Str(allow_none=True)
    status = fields.Str(
        validate=validate.OneOf(["todo", "in_progress", "in_review", "done"])
    )
    priority = fields.Str(
        validate=validate.OneOf(["low", "medium", "high", "urgent"])
    )
    due_date = fields.Date(allow_none=True)
    assignee_id = fields.Int(allow_none=True)
