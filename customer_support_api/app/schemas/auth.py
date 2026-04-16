from marshmallow import Schema, fields
from marshmallow.validate import Length


class RegisterSchema(Schema):
    name = fields.Str(required=True, validate=Length(min=1, max=160))
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=Length(min=8, max=128))


class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True)
