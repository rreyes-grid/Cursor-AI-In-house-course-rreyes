from flask import jsonify
from marshmallow import ValidationError as MarshmallowValidationError
from werkzeug.exceptions import HTTPException


class ApiError(Exception):
    """Application-level API error with HTTP status and optional payload."""

    def __init__(self, message: str, status_code: int = 400, payload=None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.payload = payload or {}


def register_error_handlers(app):
    @app.errorhandler(ApiError)
    def handle_api_error(err: ApiError):
        body = {"error": True, "message": err.message, **err.payload}
        return jsonify(body), err.status_code

    @app.errorhandler(MarshmallowValidationError)
    def handle_validation_error(err: MarshmallowValidationError):
        return (
            jsonify(
                {
                    "error": True,
                    "message": "Validation failed",
                    "errors": err.messages,
                }
            ),
            422,
        )

    @app.errorhandler(HTTPException)
    def handle_http_exception(err: HTTPException):
        return (
            jsonify(
                {
                    "error": True,
                    "message": err.description or err.name,
                    "code": err.code,
                }
            ),
            err.code or 500,
        )

    @app.errorhandler(Exception)
    def handle_unexpected_error(err: Exception):
        app.logger.exception(err)
        return (
            jsonify(
                {
                    "error": True,
                    "message": "An unexpected error occurred",
                }
            ),
            500,
        )
