from marshmallow import Schema, fields, validate

from app.schemas.user import UserSchema


class CommentCreateSchema(Schema):
    body = fields.Str(required=True, validate=validate.Length(min=1, max=10000))


class CommentSchema(Schema):
    id = fields.Int(dump_only=True)
    body = fields.Str()
    created_at = fields.DateTime(dump_only=True)
    author = fields.Nested(UserSchema, only=("id", "username"))
