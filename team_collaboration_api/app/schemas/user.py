from marshmallow import Schema, fields, validate


class UserSchema(Schema):
    id = fields.Int(dump_only=True)
    email = fields.Email(required=True)
    name = fields.Str(required=True, validate=validate.Length(min=1, max=120))
    username = fields.Str(required=True, validate=validate.Length(min=2, max=80))
    avatar_url = fields.Str(allow_none=True)
    created_at = fields.DateTime(dump_only=True)


class UserRegisterSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=8, max=128))
    name = fields.Str(required=True, validate=validate.Length(min=1, max=120))
    username = fields.Str(required=True, validate=validate.Length(min=2, max=80))
    avatar_url = fields.Str(allow_none=True)


class UserLoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True)
