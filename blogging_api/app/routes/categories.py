from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from sqlalchemy import func

from app.errors import ApiError
from app.extensions import db
from app.models import Category
from app.post_cache import invalidate_for_category_change
from app.schemas import CategoryCreateSchema, CategorySchema, CategoryUpdateSchema
from app.utils import unique_category_slug

bp = Blueprint("categories", __name__, url_prefix="/api/categories")


@bp.route("", methods=["GET"])
def list_categories():
    """
    List all categories.
    ---
    tags:
      - Categories
    responses:
      200:
        description: OK
    """
    rows = Category.query.order_by(Category.name.asc()).all()
    return jsonify(CategorySchema(many=True).dump(rows))


@bp.route("", methods=["POST"])
@jwt_required()
def create_category():
    """
    Create a category (JWT required).
    ---
    tags:
      - Categories
    security:
      - Bearer: []
    consumes:
      - application/json
    parameters:
      - in: body
        name: body
        schema:
          type: object
          required: [name]
          properties:
            name: { type: string }
    responses:
      201:
        description: Created
      409:
        description: Name/slug conflict
      422:
        description: Validation error
    """
    data = CategoryCreateSchema().load(request.get_json(force=True, silent=True) or {})
    name = data["name"].strip()
    if Category.query.filter(func.lower(Category.name) == name.lower()).first():
        raise ApiError("A category with this name already exists", 409)
    slug = unique_category_slug(name)
    cat = Category(name=name, slug=slug)
    db.session.add(cat)
    db.session.commit()
    return jsonify(CategorySchema().dump(cat)), 201


@bp.route("/<int:category_id>", methods=["PUT"])
@jwt_required()
def update_category(category_id):
    """
    Update a category (JWT required).
    ---
    tags:
      - Categories
    security:
      - Bearer: []
    parameters:
      - in: path
        name: category_id
        type: integer
        required: true
    responses:
      200:
        description: OK
      404:
        description: Not found
      409:
        description: Name conflict
      422:
        description: Validation error
    """
    cat = Category.query.get_or_404(category_id)
    data = CategoryUpdateSchema().load(request.get_json(force=True, silent=True) or {})
    if not data:
        raise ApiError("No fields to update", 400)
    if "name" in data:
        name = data["name"].strip()
        other = (
            Category.query.filter(
                func.lower(Category.name) == name.lower(),
                Category.id != category_id,
            ).first()
        )
        if other:
            raise ApiError("A category with this name already exists", 409)
        cat.name = name
        cat.slug = unique_category_slug(name, exclude_category_id=cat.id)
    db.session.commit()
    invalidate_for_category_change(cat.id)
    return jsonify(CategorySchema().dump(cat))


@bp.route("/<int:category_id>", methods=["DELETE"])
@jwt_required()
def delete_category(category_id):
    """
    Delete a category (JWT required). Posts in this category become uncategorized.
    ---
    tags:
      - Categories
    security:
      - Bearer: []
    parameters:
      - in: path
        name: category_id
        type: integer
        required: true
    responses:
      204:
        description: Deleted
      404:
        description: Not found
    """
    cat = Category.query.get_or_404(category_id)
    cid = cat.id
    invalidate_for_category_change(cid)
    db.session.delete(cat)
    db.session.commit()
    return "", 204
