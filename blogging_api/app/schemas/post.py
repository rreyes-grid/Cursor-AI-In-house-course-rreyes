from marshmallow import Schema, fields, validate

from app.schemas.category import CategorySchema
from app.schemas.user import UserSchema


class PostCreateSchema(Schema):
    title = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    body = fields.Str(required=True, validate=validate.Length(min=1))
    category_id = fields.Int(allow_none=True)
    slug = fields.Str(validate=validate.Length(max=300), load_only=True)


class PostUpdateSchema(Schema):
    title = fields.Str(validate=validate.Length(min=1, max=255))
    body = fields.Str(validate=validate.Length(min=1))
    category_id = fields.Int(allow_none=True)


class PostListItemSchema(Schema):
    id = fields.Int()
    title = fields.Str()
    body = fields.Str()
    slug = fields.Str()
    author = fields.Nested(UserSchema, only=("id", "username"))
    category = fields.Nested(CategorySchema, only=("id", "name", "slug"), allow_none=True)
    created_at = fields.DateTime()
    updated_at = fields.DateTime()


class PostDetailSchema(PostListItemSchema):
    pass
