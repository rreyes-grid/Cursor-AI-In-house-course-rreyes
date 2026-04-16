from marshmallow import Schema, fields, validate


class NotificationSchema(Schema):
    id = fields.Int(dump_only=True)
    user_id = fields.Int(dump_only=True)
    title = fields.Str(required=True)
    body = fields.Str(required=True)
    type = fields.Str(
        validate=validate.OneOf(
            [
                "info",
                "task_assigned",
                "project_update",
                "mention",
                "team_invite",
                "task_completed",
            ]
        ),
        missing="info",
    )
    read = fields.Bool(missing=False)
    related_project_id = fields.Int(allow_none=True)
    related_task_id = fields.Int(allow_none=True)
    created_at = fields.DateTime(dump_only=True)
