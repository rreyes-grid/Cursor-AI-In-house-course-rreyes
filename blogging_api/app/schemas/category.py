from marshmallow import Schema, fields, validate


class CategoryCreateSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=1, max=120))


class CategoryUpdateSchema(Schema):
    name = fields.Str(validate=validate.Length(min=1, max=120))


class CategorySchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str()
    slug = fields.Str()
    created_at = fields.DateTime(dump_only=True)
