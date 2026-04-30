from marshmallow import Schema, fields, validate


class RegisterSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(1, 160))
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=8, max=128))


class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True)


class UserUpdateSchema(Schema):
    name = fields.Str(validate=validate.Length(1, 160))


class CartAddSchema(Schema):
    product_id = fields.Int(required=True)
    quantity = fields.Int(required=True, validate=validate.Range(min=1, max=999))


class CartItemUpdateSchema(Schema):
    quantity = fields.Int(required=True, validate=validate.Range(min=1, max=999))


class DiscountApplySchema(Schema):
    code = fields.Str(required=True, validate=validate.Length(1, 48))


class CheckoutSchema(Schema):
    payment_token = fields.Str(required=True, validate=validate.Length(3, 128))
