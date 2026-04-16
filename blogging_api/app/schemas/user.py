from marshmallow import Schema, fields, validate


class UserRegisterSchema(Schema):
    email = fields.Email(required=True)
    username = fields.Str(
        required=True,
        validate=validate.Length(min=2, max=80),
    )
    password = fields.Str(
        required=True,
        validate=validate.Length(min=8, max=128),
        load_only=True,
    )


class UserLoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True, load_only=True)


class UserSchema(Schema):
    id = fields.Int(dump_only=True)
    email = fields.Email()
    username = fields.Str()
    created_at = fields.DateTime(dump_only=True)
