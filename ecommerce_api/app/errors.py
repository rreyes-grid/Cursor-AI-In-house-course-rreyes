from flask import jsonify
from marshmallow import ValidationError as MarshmallowValidationError
from werkzeug.exceptions import HTTPException


class ApiError(Exception):
    def __init__(self, message: str, status_code: int = 400, code: str = None, errors=None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code or _default_code(status_code)
        self.errors = errors


def _default_code(status: int) -> str:
    return {
        400: "VALIDATION_ERROR",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        409: "CONFLICT",
        422: "UNPROCESSABLE",
        429: "RATE_LIMIT_EXCEEDED",
    }.get(status, "INTERNAL_ERROR")


def _error_body(message: str, code: str, status: int, errors=None):
    body = {
        "status": "error",
        "message": message,
        "code": code,
    }
    if errors:
        body["errors"] = errors
    return jsonify(body), status


def register_error_handlers(app):
    @app.errorhandler(ApiError)
    def handle_api_error(err: ApiError):
        return _error_body(err.message, err.code, err.status_code, errors=err.errors)

    @app.errorhandler(MarshmallowValidationError)
    def handle_validation(err):
        return _error_body(
            "Validation failed",
            "VALIDATION_ERROR",
            400,
            errors=err.messages,
        )

    @app.errorhandler(HTTPException)
    def handle_http(err):
        code_map = {
            400: "VALIDATION_ERROR",
            401: "UNAUTHORIZED",
            403: "FORBIDDEN",
            404: "NOT_FOUND",
            409: "CONFLICT",
            429: "RATE_LIMIT_EXCEEDED",
        }
        api_code = code_map.get(err.code, "INTERNAL_ERROR")
        return _error_body(
            err.description or err.name,
            api_code,
            err.code or 500,
        )

    @app.errorhandler(Exception)
    def handle_unexpected(err):
        app.logger.exception(err)
        return _error_body(
            "An unexpected error occurred",
            "INTERNAL_ERROR",
            500,
        )
